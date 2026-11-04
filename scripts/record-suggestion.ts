/**
 * Local recording script: sends one fixture email to Claude and prints the
 * Suggestion it returns, in the shared type from lib/suggestion.ts. Not an
 * API route, and it saves nothing; copying a run into fixtures is a separate,
 * deliberate step.
 *
 * Usage (reads ANTHROPIC_API_KEY from .env.local; the key is never printed):
 *   pnpm record LL-5040 3     # a ticket ID, then how many runs
 *   pnpm record vague 3       # the "Try a vague email" paste
 *   pnpm record all           # every fixture ticket once, four at a time
 *
 * Options:
 *   --save <file>     write each run as recorded output (source "recorded",
 *                     with its model and date) into a JSON array, replacing
 *                     any earlier recording for the same ticket
 *   --except <ids>    with "all", skip these comma-separated ticket IDs
 *
 * When Claude answers "Not a request", the script asks again as a person
 * pressing "Triage anyway" would, and records that normal suggestion too,
 * so the demo works without a live call. Every recording carries the
 * prompt version: a hash of the prompt and schema.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { helpArticles, helpArticleTitles } from "../fixtures/help-center.ts";
import { tickets, vagueEmail } from "../fixtures/tickets.ts";
import { toPercent, unsureReason } from "../lib/confidence.ts";
import { matchEvidence } from "../lib/evidence.ts";
import {
  categories,
  notARequestReasons,
  urgencies,
  type NotARequestSuggestion,
  type Suggestion,
  type TriageSuggestion,
} from "../lib/suggestion.ts";

const MODEL = "claude-sonnet-5-5";
/** Claude Sonnet 5.5, $ per million tokens. Thinking tokens bill as output. */
const PRICE = { input: 2, output: 10 };

// --- What we ask for -------------------------------------------------------

const HELP_CENTER = helpArticles.map((a) => `<article title="${a.title}">\n${a.body}\n</article>`).join("\n\n");

const SYSTEM = `You triage support email for Ledgerline, a B2B invoicing product. For each email, first decide whether it's a request. If it is, suggest a category and an urgency, quote the evidence for them, and draft a reply a support agent will review before sending.

Not a request: some emails need nothing from support. Use kind "not-a-request" for an automatic reply (out of office, a ticket-resolved notice), an empty message, one sent to the wrong place (such as a reply from a customer's own client), or one with nothing to do. Give the reason and one short sentence explaining it, quote what shows it as evidence supporting the category, and set category, urgency and draft to null. Never force a category onto an email that isn't a request. Otherwise use kind "triage" and set notARequest to null.

Categories:
- How-to: the customer wants to know how to do something Ledgerline already supports.
- Billing: Ledgerline's own charges to the customer: their plan, subscription, payments to Ledgerline, or invoices Ledgerline sent them.
- Bug: something in Ledgerline is broken or behaving wrongly.
- Feature request: the customer wants something Ledgerline doesn't do.
- Cancellation risk: signs the customer may leave or not renew: renewal doubts, reviewing tools, moving data out, comparing alternatives.

Urgencies:
- Urgent: money, access or data is at risk right now, or a hard deadline is days away.
- High: a near deadline or a blocking problem for the customer's work.
- Normal: a real need with no pressing deadline.
- Low: curiosity or a nice-to-have.

Confidence: give your honest probability (0 to 1) that each pick is right, and the same for the runner-up, the next most likely option. Treat them as parts of one distribution over all options, so a pick and its runner-up add up to at most 1. When the email is ambiguous, say so with your numbers rather than picking confidently.

Evidence from the email: quote the exact words from the email's subject line or body, character for character, that support each pick. Mark each quote as supporting the category or the urgency, with article set to null. Only quote words that appear in the email.

Draft: a short, friendly reply to the customer from "Ledgerline Support". It may state only facts found in the customer's email or in the help-center articles below. Anything else Ledgerline-specific that the reply needs, such as a date, an amount, a name or an account detail, is a placeholder in square brackets, for example [renewal price]. Never invent facts about Ledgerline. Each time the draft relies on an article, add an evidence item that supports "draft", gives the article's exact title, and quotes the sentence it relies on, character for character.

Draft format: the greeting on its own line ("Hi Aisha,"), then short paragraphs of two or three sentences each, with a blank line between paragraphs, then the sign-off on its own lines ("Best,\nLedgerline Support"). Never one long paragraph.

Questions to the customer: when the draft asks the customer for something, ask in plain words. Never put a placeholder inside a question; a placeholder is a gap for the support agent to fill, not something to ask the customer.

Agent note: the draft is only ever words to the customer. Never put advice or instructions for the support agent in it, not even in brackets. If the agent should know or do something (check an account, loop in a colleague, watch for a risk), say it in agentNote, in one or two sentences addressed to the agent. If there's nothing to add, set agentNote to null.

Help-center articles:

${HELP_CENTER}`;

const fieldSchema = (options: readonly string[]) => ({
  type: "object",
  properties: {
    value: { type: "string", enum: options },
    confidence: { type: "number", description: "Probability from 0 to 1 that this pick is right." },
    runnerUp: {
      type: "object",
      properties: {
        value: { type: "string", enum: options },
        confidence: { type: "number", description: "Probability from 0 to 1 that the runner-up is right." },
      },
      required: ["value", "confidence"],
      additionalProperties: false,
    },
  },
  required: ["value", "confidence", "runnerUp"],
  additionalProperties: false,
});

const nullable = (schema: object) => ({ anyOf: [schema, { type: "null" }] });

/** Sent as output_config.format, so the response always parses into this shape. */
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    kind: { type: "string", enum: ["triage", "not-a-request"] },
    notARequest: nullable({
      type: "object",
      properties: {
        reason: { type: "string", enum: notARequestReasons },
        explanation: { type: "string" },
      },
      required: ["reason", "explanation"],
      additionalProperties: false,
    }),
    category: nullable(fieldSchema(categories)),
    urgency: nullable(fieldSchema(urgencies)),
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          supports: { type: "string", enum: ["category", "urgency", "draft"] },
          article: { anyOf: [{ type: "string", enum: helpArticleTitles }, { type: "null" }] },
        },
        required: ["quote", "supports", "article"],
        additionalProperties: false,
      },
    },
    draft: nullable({ type: "string" }),
    agentNote: nullable({ type: "string" }),
  },
  required: ["kind", "notARequest", "category", "urgency", "evidence", "draft", "agentNote"],
  additionalProperties: false,
};

/** Checks what the JSON schema can't express: confidences between 0 and 1. */
const probability = z.number().min(0).max(1);
const field = <T extends readonly [string, ...string[]]>(options: T) =>
  z.object({
    value: z.enum(options),
    confidence: probability,
    runnerUp: z.object({ value: z.enum(options), confidence: probability }),
  });
const Output = z.object({
  kind: z.enum(["triage", "not-a-request"]),
  notARequest: z.object({ reason: z.enum(notARequestReasons), explanation: z.string() }).nullable(),
  category: field(categories).nullable(),
  urgency: field(urgencies).nullable(),
  evidence: z.array(
    z.union([
      z
        .object({ quote: z.string(), supports: z.enum(["category", "urgency"]), article: z.null() })
        .transform(({ quote, supports }) => ({ quote, supports })),
      z.object({ quote: z.string(), supports: z.literal("draft"), article: z.enum(helpArticleTitles) }),
    ]),
  ),
  draft: z.string().nullable(),
  agentNote: z.string().nullable(),
});

/**
 * Placeholders that are instructions to the support agent ("[Confirm whether
 * a PO field exists]") rather than gaps for a fact ("[invoice number]").
 * Advice belongs in agentNote; a run with one of these is rejected.
 */
const AGENT_INSTRUCTION =
  /^\[\s*(agent\b|note\b|todo\b|(confirm|check|verify|consider|add|insert|include|describe|explain|ask|loop|escalate|mention|make sure|find out|look up|update|replace|fill in|decide|investigate|follow up)\b)|\bagent\b|\bsupport team\b/i;

function instructionPlaceholders(draft: string): string[] {
  return (draft.match(/\[[^\]\n]+\]/g) ?? []).filter((p) => AGENT_INSTRUCTION.test(p));
}

/** The request a person sends with "Triage anyway". */
const TRIAGE_ANYWAY = `A person reviewed your suggestion that this isn't a request and chose "Triage anyway". Set kind to "triage" and give a category, urgency, evidence and draft as for any request.`;

/** Which prompt produced a recording: a hash of everything that shapes the answer. */
const PROMPT_VERSION = `p-${createHash("sha256").update(SYSTEM).update(JSON.stringify(OUTPUT_SCHEMA)).update(TRIAGE_ANYWAY).digest("hex").slice(0, 8)}`;

// --- The email -------------------------------------------------------------

function emailFor(arg: string): { id: string; subject: string; body: string; text: string } {
  if (arg === "vague") {
    return {
      id: "vague",
      subject: vagueEmail.subject,
      body: vagueEmail.body,
      text: `From: ${vagueEmail.name}\nSubject: ${vagueEmail.subject}\n\n${vagueEmail.body}`,
    };
  }
  const t = tickets.find((x) => x.id === arg);
  if (!t) throw new Error(`No fixture ticket "${arg}". Pass a ticket ID such as LL-5040, or "vague".`);
  const account = t.account ? `${t.account.company} (${t.account.plan})` : "no matching Ledgerline account";
  return {
    id: t.id,
    subject: t.subject,
    body: t.body,
    text: `From: ${t.from.name} <${t.from.email}>\nAccount: ${account}\nSubject: ${t.subject}\n\n${t.body}`,
  };
}

// --- One run ---------------------------------------------------------------

const client = new Anthropic();

type Email = ReturnType<typeof emailFor>;

/** One call to Claude. forced: the "Triage anyway" request. */
async function ask(email: Email, forced: boolean) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // On a safety decline, re-run on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: `Triage this email.\n\n${email.text}${forced ? `\n\n${TRIAGE_ANYWAY}` : ""}` }],
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
  });
  const cost = (response.usage.input_tokens * PRICE.input + response.usage.output_tokens * PRICE.output) / 1_000_000;
  const base = { servedBy: response.model, stop: response.stop_reason as string, cost };
  if (response.stop_reason === "refusal") return { ...base, problem: `refusal (${response.stop_details?.category ?? "no category"})` };
  if (response.stop_reason === "max_tokens") return { ...base, problem: "max_tokens" };

  const raw = JSON.parse(response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""));
  const parsed = Output.safeParse(raw);
  if (!parsed.success) return { ...base, problem: `invalid: ${parsed.error.issues.map((i) => i.message).join("; ")}`, raw };
  const o = parsed.data;
  const meta = {
    ticketId: email.id,
    source: "live" as const,
    suggestedAt: new Date().toISOString(),
    model: response.model,
    promptVersion: PROMPT_VERSION,
    ...(o.agentNote ? { agentNote: o.agentNote } : {}),
  };

  // The schema allows both shapes at once; each kind must fill exactly its own fields.
  if (o.kind === "not-a-request") {
    if (forced) return { ...base, problem: 'invalid: "Triage anyway" still answered not-a-request', raw };
    if (!o.notARequest || o.category || o.urgency || o.draft !== null || o.evidence.some((e) => e.supports === "draft"))
      return { ...base, problem: "invalid: not-a-request with triage fields", raw };
    const evidence = o.evidence.flatMap((e) => (e.supports === "draft" ? [] : [e]));
    const suggestion: NotARequestSuggestion = { ...meta, kind: "not-a-request", ...o.notARequest, evidence };
    return { ...base, suggestion };
  }
  if (!o.category || !o.urgency || o.draft === null || o.notARequest)
    return { ...base, problem: "invalid: triage with missing or not-a-request fields", raw };
  const instructions = instructionPlaceholders(o.draft);
  if (instructions.length > 0)
    return { ...base, problem: `invalid: placeholder is an instruction to the agent: ${instructions.join(", ")}`, raw };
  const suggestion: TriageSuggestion = {
    ...meta,
    kind: "triage",
    category: o.category,
    urgency: o.urgency,
    evidence: o.evidence,
    draft: o.draft,
  };
  return { ...base, suggestion };
}

/** What to check in a triage suggestion against our rules. */
function checkTriage(email: Email, s: TriageSuggestion) {
  const describe = (f: TriageSuggestion["category"] | TriageSuggestion["urgency"]) => {
    const reason = unsureReason(f.confidence, f.runnerUp?.confidence);
    return {
      pick: `${f.value} ${toPercent(f.confidence)}%`,
      runnerUp: f.runnerUp ? `${f.runnerUp.value} ${toPercent(f.runnerUp.confidence)}%` : "none",
      unsure:
        reason === "low"
          ? "yes: under 60%"
          : reason === "close"
            ? `yes: within 15 points (${toPercent(f.confidence) - toPercent(f.runnerUp!.confidence)})`
            : "no",
    };
  };
  const email_ = s.evidence.filter((e) => e.supports !== "draft");
  return {
    category: describe(s.category),
    urgency: describe(s.urgency),
    emailEvidence: `${matchEvidence(email.body, s.evidence, email.subject).length} of ${email_.length} email quotes match word for word`,
    articleEvidence: s.evidence.flatMap((e) =>
      e.supports === "draft"
        ? [`${e.article}: ${helpArticles.find((a) => a.title === e.article)?.body.includes(e.quote) ? "matches" : "DOES NOT MATCH"} word for word`]
        : [],
    ),
    placeholders: [...new Set(s.draft.match(/\[[^\]\n]+\]/g) ?? [])],
    placeholdersInQuestions: s.draft
      .split(/(?<=[.?!])\s+/)
      .filter((sentence: string) => sentence.trim().endsWith("?") && /\[[^\]\n]+\]/.test(sentence)),
  };
}

async function record(email: Email, run: number) {
  const first = await ask(email, false);
  if (!("suggestion" in first) || !first.suggestion) return { run, ticketId: email.id, ...first };
  if (first.suggestion.kind === "triage") {
    return { run, ticketId: email.id, ...first, checks: checkTriage(email, first.suggestion) };
  }
  // Not a request: record what "Triage anyway" would show, too.
  const anyway = await ask(email, true);
  const cost = first.cost + anyway.cost;
  if (!("suggestion" in anyway) || !anyway.suggestion || anyway.suggestion.kind !== "triage") {
    return { run, ticketId: email.id, ...first, cost, problem: `"Triage anyway" ${"problem" in anyway ? anyway.problem : "failed"}` };
  }
  const suggestion: NotARequestSuggestion = { ...first.suggestion, triageAnyway: anyway.suggestion };
  const matched = matchEvidence(email.body, suggestion.evidence, email.subject).length;
  return {
    run,
    ticketId: email.id,
    ...first,
    cost,
    suggestion,
    checks: {
      notARequest: `${suggestion.reason}: ${suggestion.explanation}`,
      emailEvidence: `${matched} of ${suggestion.evidence.length} email quotes match word for word`,
      triageAnyway: checkTriage(email, anyway.suggestion),
    },
  };
}

// --- Main ------------------------------------------------------------------

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const [target, runsArg] = positional;
if (!target) throw new Error('Pass a ticket ID (e.g. LL-5040), "vague" or "all".');
const saveTo = option("--save");
const except = new Set((option("--except") ?? "").split(",").filter(Boolean));

const jobs =
  target === "all"
    ? tickets.filter((t) => !except.has(t.id)).map((t) => ({ email: emailFor(t.id), run: 1 }))
    : Array.from({ length: Number(runsArg ?? 1) }, (_, i) => ({ email: emailFor(target), run: i + 1 }));

async function runJob(job: (typeof jobs)[number]) {
  try {
    return await record(job.email, job.run);
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error("The API key was rejected.");
    if (error instanceof Anthropic.RateLimitError) throw new Error("Rate limited; try again shortly.");
    if (error instanceof Anthropic.APIError) throw new Error(`API error ${error.status} on ${job.email.id}: ${error.message}`);
    throw error;
  }
}

/** Writes valid runs as recorded output, replacing earlier recordings of the same ticket. */
function save(file: string, batch: Awaited<ReturnType<typeof record>>[]) {
  const saved: Suggestion[] = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : [];
  for (const result of batch) {
    if (!("suggestion" in result) || !result.suggestion) continue;
    const s = result.suggestion as Suggestion;
    const recorded: Suggestion =
      s.kind === "not-a-request" && s.triageAnyway
        ? { ...s, source: "recorded", triageAnyway: { ...s.triageAnyway, source: "recorded" } }
        : { ...s, source: "recorded" };
    const at = saved.findIndex((s) => s.ticketId === recorded.ticketId);
    if (at >= 0) saved[at] = recorded;
    else saved.push(recorded);
  }
  saved.sort((a, b) => a.ticketId.localeCompare(b.ticketId));
  writeFileSync(file, `${JSON.stringify(saved, null, 2)}\n`);
}

// Four at a time, so a full run of the fixtures takes minutes, not an hour.
// Each batch is saved as it lands, so an API error late in a run loses nothing.
const results: Awaited<ReturnType<typeof record>>[] = [];
for (let i = 0; i < jobs.length; i += 4) {
  const batch = await Promise.all(jobs.slice(i, i + 4).map(runJob));
  for (const result of batch) {
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }
  if (saveTo) save(saveTo, batch);
}

const total = results.reduce((sum, r) => sum + r.cost, 0);
console.log(
  JSON.stringify({ target, runs: results.length, promptVersion: PROMPT_VERSION, totalCostUsd: Number(total.toFixed(4)), savedTo: saveTo ?? null }),
);

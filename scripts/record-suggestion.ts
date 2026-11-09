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
 *
 * The prompt, schema and validation live in lib/triage-prompt.ts, shared
 * with the live route (app/api/triage).
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { helpArticles } from "../fixtures/help-center.ts";
import { tickets, vagueEmail } from "../fixtures/tickets.ts";
import { toPercent, unsureReason } from "../lib/confidence.ts";
import { matchEvidence } from "../lib/evidence.ts";
import type { NotARequestSuggestion, Suggestion, TriageSuggestion } from "../lib/suggestion.ts";
import { MODEL, OUTPUT_SCHEMA, PRICE, PROMPT_VERSION, SYSTEM, TRIAGE_ANYWAY, toSuggestion } from "../lib/triage-prompt.ts";

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
  const result = toSuggestion(raw, { model: response.model, forced });
  if (result.problem !== undefined) return { ...base, problem: result.problem, raw };
  const suggestion = { ticketId: email.id, ...result.suggestion } as Suggestion;
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

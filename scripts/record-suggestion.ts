/**
 * Local recording script: sends one fixture email to Claude and prints the
 * Suggestion it returns, in the shared type from lib/suggestion.ts. Not an
 * API route, and it saves nothing; copying a run into fixtures is a separate,
 * deliberate step.
 *
 * Usage (reads ANTHROPIC_API_KEY from .env.local; the key is never printed):
 *   pnpm record LL-5040 3     # a ticket ID, then how many runs
 *   pnpm record vague 3       # the "Try a vague email" paste
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { tickets, vagueEmail } from "../fixtures/tickets.ts";
import { toPercent, unsureReason } from "../lib/confidence.ts";
import { matchEvidence } from "../lib/evidence.ts";
import { categories, urgencies, type Suggestion } from "../lib/suggestion.ts";

const MODEL = "claude-sonnet-5-5";
/** Claude Sonnet 5.5, $ per million tokens. Thinking tokens bill as output. */
const PRICE = { input: 2, output: 10 };

// --- What we ask for -------------------------------------------------------

const SYSTEM = `You triage support email for Ledgerline, a B2B invoicing product. For each email, suggest a category and an urgency, quote the evidence for them, and draft a reply a support agent will review before sending.

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

Evidence: quote the exact words from the email, character for character, that support each pick. Mark each quote as supporting the category or the urgency. Only quote words that appear in the email.

Draft: a short, friendly reply to the customer from "Ledgerline Support". Use a placeholder in square brackets only for a fact you can't know, such as a date, an amount, a name, an account detail or a link, for example [invoice number]. Never invent facts about Ledgerline.

Agent note: the draft is only ever words to the customer. Never put advice or instructions for the support agent in it, not even in brackets. If the agent should know or do something (check an account, loop in a colleague, watch for a risk), say it in agentNote, in one or two sentences addressed to the agent. If there's nothing to add, set agentNote to null.`;

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

/** Sent as output_config.format, so the response always parses into this shape. */
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    category: fieldSchema(categories),
    urgency: fieldSchema(urgencies),
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: {
          quote: { type: "string" },
          supports: { type: "string", enum: ["category", "urgency"] },
        },
        required: ["quote", "supports"],
        additionalProperties: false,
      },
    },
    draft: { type: "string" },
    agentNote: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["category", "urgency", "evidence", "draft", "agentNote"],
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
  category: field(categories),
  urgency: field(urgencies),
  evidence: z.array(z.object({ quote: z.string(), supports: z.enum(["category", "urgency"]) })),
  draft: z.string(),
  agentNote: z.string().nullable(),
});

// --- The email -------------------------------------------------------------

function emailFor(arg: string): { id: string; body: string; text: string } {
  if (arg === "vague") {
    return {
      id: "vague",
      body: vagueEmail.body,
      text: `From: ${vagueEmail.name}\nSubject: ${vagueEmail.subject}\n\n${vagueEmail.body}`,
    };
  }
  const t = tickets.find((x) => x.id === arg);
  if (!t) throw new Error(`No fixture ticket "${arg}". Pass a ticket ID such as LL-5040, or "vague".`);
  const account = t.account ? `${t.account.company} (${t.account.plan})` : "no matching Ledgerline account";
  return {
    id: t.id,
    body: t.body,
    text: `From: ${t.from.name} <${t.from.email}>\nAccount: ${account}\nSubject: ${t.subject}\n\n${t.body}`,
  };
}

// --- One run ---------------------------------------------------------------

const client = new Anthropic();

async function record(email: ReturnType<typeof emailFor>, run: number) {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // On a safety decline, re-run on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: `Triage this email.\n\n${email.text}` }],
    output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
  });

  const cost =
    (response.usage.input_tokens * PRICE.input + response.usage.output_tokens * PRICE.output) / 1_000_000;
  const servedBy = response.model;

  if (response.stop_reason === "refusal") {
    return { run, servedBy, stop: "refusal", category: response.stop_details?.category ?? null, cost };
  }
  if (response.stop_reason === "max_tokens") {
    return { run, servedBy, stop: "max_tokens", cost };
  }

  const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const { agentNote, ...output } = Output.parse(JSON.parse(text));
  const suggestion: Suggestion = {
    ticketId: email.id,
    source: "live",
    suggestedAt: new Date().toISOString(),
    ...output,
    ...(agentNote ? { agentNote } : {}),
  };

  const describe = (f: Suggestion["category"] | Suggestion["urgency"]) => {
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

  return {
    run,
    servedBy,
    stop: response.stop_reason,
    category: describe(suggestion.category),
    urgency: describe(suggestion.urgency),
    evidence: `${matchEvidence(email.body, suggestion.evidence).length} of ${suggestion.evidence.length} quotes match word for word`,
    placeholders: [...new Set(suggestion.draft.match(/\[[^\]\n]+\]/g) ?? [])],
    tokens: { input: response.usage.input_tokens, output: response.usage.output_tokens },
    cost,
    suggestion,
  };
}

// --- Main ------------------------------------------------------------------

const [arg, runsArg] = process.argv.slice(2);
if (!arg) throw new Error('Pass a ticket ID (e.g. LL-5040) or "vague".');
const runs = Number(runsArg ?? 1);
const email = emailFor(arg);

let total = 0;
for (let run = 1; run <= runs; run++) {
  try {
    const result = await record(email, run);
    total += result.cost;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) throw new Error("The API key was rejected.");
    if (error instanceof Anthropic.RateLimitError) throw new Error("Rate limited; try again shortly.");
    if (error instanceof Anthropic.APIError) throw new Error(`API error ${error.status}: ${error.message}`);
    throw error;
  }
}
console.log(JSON.stringify({ email: email.id, runs, totalCostUsd: Number(total.toFixed(4)) }));

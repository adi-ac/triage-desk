/**
 * POST /api/triage: triages one pasted email with the live model
 * (docs/brief.md, "Live triage"). Takes a TriageRequest
 * (lib/triage-request.ts) and answers with a Suggestion, source "live",
 * without a ticket ID (the client adds it), or a TriageError.
 *
 * Before any model call: the kill switch (LIVE_TRIAGE=off), the input, the
 * per-visitor limit (LIVE_TRIAGE_PER_VISITOR a UTC day, default 5) and the
 * daily spend cap (LIVE_TRIAGE_DAILY_CAP_USD, default 2), which reserves
 * each call's worst case and settles to its real cost afterwards.
 *
 * TRIAGE_FAKE=1 answers from the recordings after about 3.5s, without
 * calling the model, but with the limits counting for real.
 * TRIAGE_FAKE_ERROR=model|visitor-limit|daily-cap forces that error.
 *
 * Never logs the email or the API key.
 *
 * Node.js runtime: the default, and with Cache Components on the route may
 * not declare `runtime` at all.
 */

import { randomBytes } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { suggestions } from "@/fixtures/suggestions";
import {
  actualCost,
  nextUtcMidnight,
  reserveSpend,
  takeVisitorTriage,
  worstCaseCost,
  type CounterStore,
} from "@/lib/live-limits";
import { counterStore } from "@/lib/live-store";
import type { NotARequestSuggestion, Suggestion, TriageSuggestion } from "@/lib/suggestion";
import { TriageRequest, type TriageError } from "@/lib/triage-request";
import {
  MODEL,
  OUTPUT_SCHEMA,
  PRICE,
  SYSTEM,
  pastedEmailMessage,
  toSuggestion,
  type LiveSuggestion,
} from "@/lib/triage-prompt";
import { identifyVisitor, VISITOR_COOKIE, visitorSecret } from "@/lib/visitor";

/** Two model calls at most (one retry), each well under a minute. */
export const maxDuration = 120;

/**
 * Output tokens per call, thinking included. Recorded triages use a few
 * thousand; this leaves room without letting one call run up the bill.
 */
const MAX_TOKENS = 8000;
/** What the API adds around the request's bytes (role markers, the output format). Measured, with room to spare. */
const OVERHEAD_TOKENS = 2000;
/** Fake mode's pause, about as long as a real triage takes. */
const FAKE_DELAY_MS = 3500;
/** No legitimate body comes near this (the fields' limits add up to under 6,000 characters). */
const MAX_BODY_BYTES = 64 * 1024;

const encoder = new TextEncoder();
const bytes = (s: string) => encoder.encode(s).length;
const FIXED_BYTES = bytes(SYSTEM) + bytes(JSON.stringify(OUTPUT_SCHEMA));

function envNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return process.env[name]?.trim() && Number.isFinite(value) && value >= 0 ? value : fallback;
}

let anthropic: Anthropic | null = null;
/** Created on first use; reads ANTHROPIC_API_KEY. One SDK retry, and a timeout that fits maxDuration. */
const client = () => (anthropic ??= new Anthropic({ maxRetries: 1, timeout: 50_000 }));

type Outcome = { suggestion: LiveSuggestion } | Exclude<TriageError, { error: "invalid" }>;

export async function POST(request: NextRequest): Promise<Response> {
  const json = (body: LiveSuggestion | TriageError, status: number, headers: Record<string, string> = {}) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

  const fake = process.env.TRIAGE_FAKE === "1";
  if (process.env.LIVE_TRIAGE === "off" || (!fake && !process.env.ANTHROPIC_API_KEY)) {
    return json({ error: "unavailable" }, 503);
  }

  // The input, before anything is counted.
  const text = await request.text();
  if (bytes(text) > MAX_BODY_BYTES) return json({ error: "invalid", fields: [] }, 400);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "invalid", fields: [] }, 400);
  }
  const input = TriageRequest.safeParse(body);
  if (!input.success) {
    const fields = [
      ...new Set(
        input.error.issues.flatMap((i) =>
          i.path.length ? [String(i.path[0])] : i.code === "unrecognized_keys" ? i.keys : [],
        ),
      ),
    ];
    return json({ error: "invalid", fields }, 400);
  }

  // The limits' store and secret: without them, fail closed.
  const store = counterStore();
  const secret = visitorSecret();
  if (!store || !secret) return json({ error: "unavailable" }, 503);
  const visitor = identifyVisitor(secret, request.headers, request.cookies.get(VISITOR_COOKIE)?.value);
  const cookie: Record<string, string> = visitor.setCookie ? { "Set-Cookie": visitor.setCookie } : {};

  const forcedError = fake ? process.env.TRIAGE_FAKE_ERROR : undefined;
  if (forcedError === "visitor-limit" || forcedError === "daily-cap") {
    return limited({ error: forcedError, resetsAt: new Date(nextUtcMidnight(Date.now())).toISOString() });
  }

  function limited(outcome: { error: "visitor-limit" | "daily-cap"; resetsAt: string }) {
    const seconds = Math.max(1, Math.ceil((Date.parse(outcome.resetsAt) - Date.now()) / 1000));
    return json(outcome, 429, { ...cookie, "Retry-After": String(seconds) });
  }

  let outcome: Outcome;
  try {
    const perVisitor = Math.floor(envNumber("LIVE_TRIAGE_PER_VISITOR", 5));
    const taken = await takeVisitorTriage(store, visitor.ids, perVisitor, Date.now());
    if (!taken.ok) return limited({ error: "visitor-limit", resetsAt: taken.resetsAt });
    const cap = envNumber("LIVE_TRIAGE_DAILY_CAP_USD", 2);
    const forced = input.data.triageAnyway === true;
    outcome = fake
      ? await triageFake(store, cap, input.data, forced, forcedError === "model")
      : await triageLive(store, cap, input.data, forced);
    // The visitor isn't charged for a triage that didn't happen.
    if (!("suggestion" in outcome)) await taken.release();
  } catch (error) {
    // The store failed (Redis unreachable): fail closed. Its error names no email or key.
    console.error("triage: counter store failed", error instanceof Error ? error.name : "unknown");
    return json({ error: "unavailable" }, 503, cookie);
  }

  if ("suggestion" in outcome)
    return json(outcome.suggestion, 200, { ...cookie, ...(fake ? { "X-Triage-Fake": "1" } : {}) });
  if (outcome.error === "visitor-limit" || outcome.error === "daily-cap") return limited(outcome);
  return json(outcome, outcome.error === "model" ? 502 : 503, cookie);
}

/**
 * One triage with the live model: reserve the call's worst case, call, settle
 * to its real cost, validate. An answer that fails validation (or runs out of
 * tokens) is asked for once more, with its own reservation. A refusal isn't
 * retried: the same email would be refused again.
 */
async function triageLive(store: CounterStore, cap: number, email: TriageRequest, forced: boolean): Promise<Outcome> {
  const content = pastedEmailMessage(email, forced, randomBytes(6).toString("hex"));
  const worstCase = worstCaseCost(PRICE, FIXED_BYTES + bytes(content), OVERHEAD_TOKENS, MAX_TOKENS);

  for (let attempt = 1; attempt <= 2; attempt++) {
    const reservation = await reserveSpend(store, worstCase, cap, Date.now());
    if (!reservation.ok) return { error: "daily-cap", resetsAt: reservation.resetsAt };

    let response: Anthropic.Message;
    try {
      response = await client().messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM,
        messages: [{ role: "user", content }],
        output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
      });
    } catch (error) {
      // An error the API answered with isn't billed: give the reservation back. A timeout or a dropped
      // connection might have been, so its reservation stays.
      if (error instanceof Anthropic.APIError && error.status !== undefined) await reservation.settle(0);
      console.error(
        "triage: model call failed",
        error instanceof Anthropic.APIError ? (error.status ?? error.name) : "unknown",
      );
      if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
        return { error: "unavailable" };
      }
      return { error: "model" };
    }
    const cost = actualCost(PRICE, response.usage);
    await reservation.settle(cost);
    // Counts and dollars only, never content: for checking the worst case against real calls.
    console.info(
      `triage: attempt ${attempt} cost $${cost.toFixed(4)} of $${worstCase.toFixed(4)} reserved (in ${response.usage.input_tokens}, out ${response.usage.output_tokens}, ${response.stop_reason})`,
    );

    if (response.stop_reason === "refusal") {
      console.error("triage: refusal", response.stop_details?.category ?? "no category");
      return { error: "model" };
    }
    if (response.stop_reason === "max_tokens") {
      console.error(`triage: attempt ${attempt} ran out of tokens`);
      continue;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""));
    } catch {
      console.error(`triage: attempt ${attempt} wasn't JSON`);
      continue;
    }
    const result = toSuggestion(raw, { model: response.model, forced });
    if (result.suggestion) return { suggestion: result.suggestion };
    // The problem can quote the draft, which can quote the email: log only that it failed.
    console.error(`triage: attempt ${attempt} failed validation`);
  }
  return { error: "model" };
}

/**
 * Fake mode: a recorded suggestion after a pause, with the spend cap
 * counting each call's worst case (so the cap can be reached for real in
 * testing). "thanks" anywhere in the message answers "not a request";
 * otherwise the message picks one of the recorded triages, the same one each
 * time.
 */
async function triageFake(
  store: CounterStore,
  cap: number,
  email: TriageRequest,
  forced: boolean,
  failModel: boolean,
): Promise<Outcome> {
  const content = pastedEmailMessage(email, forced, "fake");
  const reservation = await reserveSpend(
    store,
    worstCaseCost(PRICE, FIXED_BYTES + bytes(content), OVERHEAD_TOKENS, MAX_TOKENS),
    cap,
    Date.now(),
  );
  if (!reservation.ok) return { error: "daily-cap", resetsAt: reservation.resetsAt };
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));
  if (failModel) {
    await reservation.settle(0);
    return { error: "model" };
  }

  const notARequest = suggestions.find(
    (s): s is NotARequestSuggestion => s.kind === "not-a-request" && !!s.triageAnyway,
  );
  const triages = suggestions.filter((s): s is TriageSuggestion => s.kind === "triage");
  let pick: Suggestion;
  if (/thanks/i.test(email.message) && notARequest) {
    pick = forced ? notARequest.triageAnyway! : notARequest;
  } else {
    const hash = [...email.message].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    pick = triages[hash % triages.length];
  }
  return { suggestion: asLive(pick) };
}

/** A recording as the live route would answer: no ticket ID, no nested "Triage anyway", source live, made now. */
function asLive(s: Suggestion): LiveSuggestion {
  const copy: Record<string, unknown> = { ...s, source: "live", suggestedAt: new Date().toISOString() };
  delete copy.ticketId;
  delete copy.triageAnyway;
  return copy as LiveSuggestion;
}

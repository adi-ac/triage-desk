/**
 * Model output for the example tickets, kept apart from the emails in
 * tickets.ts so an input can't be mistaken for an answer. Every entry names
 * its source in the data; the interface doesn't label it (docs/brief.md,
 * 5 November 2026).
 *
 * All of it is recorded output (recorded-suggestions.json): real runs of
 * scripts/record-suggestion.ts, each with its model, date and prompt
 * version, all from one prompt version. Re-record the whole set together
 * when the prompt changes, so recordings never mix prompt versions.
 */

import type { RuleSend, Suggestion } from "@/lib/suggestion";
import recordedJson from "./recorded-suggestions.json";
import { autoSendTicketId } from "./tickets";

/** Written by the recording script, which validates every run before saving it. */
const recorded = recordedJson as Suggestion[];

/** The "Try a vague email" paste, recorded like a ticket under the ID "vague". */
export const vagueEmailSuggestion: Suggestion | undefined = recorded.find((s) => s.ticketId === "vague");

export const suggestions: readonly Suggestion[] = recorded.filter((s) => s.ticketId !== "vague");

export function suggestionFor(ticketId: string): Suggestion | undefined {
  return suggestions.find((s) => s.ticketId === ticketId);
}

/** Replies sent by a team rule, without review. */
export const ruleSends: readonly RuleSend[] = [
  {
    ticketId: autoSendTicketId,
    rule: "How-to questions",
    condition: "How-to, confidence 90% or higher",
    sentAt: "2026-11-02T16:31:20Z",
  },
];

export function ruleSendFor(ticketId: string): RuleSend | undefined {
  return ruleSends.find((r) => r.ticketId === ticketId);
}

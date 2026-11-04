/**
 * Model output for the example tickets, kept apart from the emails in
 * tickets.ts so an input can't be mistaken for an answer. Every entry names
 * its source, and screens show it with OutputSource.
 *
 * Recorded output (recorded-suggestions.json) comes from real runs of
 * scripts/record-suggestion.ts, each with its model and date, and wins over
 * a hand-written entry for the same ticket. Hand-written entries are for the
 * build only and must be replaced before shipping (docs/brief.md).
 */

import type { RuleSend, Suggestion } from "@/lib/suggestion";
import recordedJson from "./recorded-suggestions.json";
import { autoSendTicketId } from "./tickets";

/** Written by the recording script, which validates every run before saving it. */
const recorded = recordedJson as Suggestion[];

/** The "Try a vague email" paste, recorded like a ticket under the ID "vague". */
export const vagueEmailSuggestion: Suggestion | undefined = recorded.find((s) => s.ticketId === "vague");

const handWritten: readonly Suggestion[] = [
  {
    // Sent by the "How-to questions" rule: How-to at 90% or more.
    ticketId: autoSendTicketId,
    kind: "triage",
    source: "hand-written",
    suggestedAt: "2026-11-02T16:31:12Z",
    category: { value: "How-to", confidence: 0.94, runnerUp: { value: "Feature request", confidence: 0.04 } },
    urgency: { value: "Low", confidence: 0.88, runnerUp: { value: "Normal", confidence: 0.1 } },
    evidence: [
      { quote: "Where do I upload it?", supports: "category" },
      { quote: "I'd like it to appear at the top of the invoices we send", supports: "category" },
    ],
    draft: `Hi Tom,

Congratulations on the new logo. You can upload it in Settings → Branding → Invoice logo. It appears at the top of every invoice you send from then on, including reminders.

Best,
Ledgerline Support`,
  },
];

export const suggestions: readonly Suggestion[] = [
  ...recorded.filter((s) => s.ticketId !== "vague"),
  ...handWritten.filter((h) => !recorded.some((r) => r.ticketId === h.ticketId)),
];

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

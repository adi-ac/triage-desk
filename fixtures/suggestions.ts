/**
 * Model output for the example tickets, kept apart from the emails in
 * tickets.ts so an input can't be mistaken for an answer. Every entry names
 * its source, and screens show it with OutputSource.
 *
 * LL-5040 is hand-written until the API key is added (docs/brief.md), and
 * must be replaced by a recorded run before shipping. Its numbers match the
 * early /system copy: How-to leads Cancellation risk 0.48 to 0.41.
 */

import type { RuleSend, Suggestion } from "@/lib/suggestion";
import { autoSendTicketId, firstScreenTicketId } from "./tickets";

export const suggestions: readonly Suggestion[] = [
  {
    ticketId: firstScreenTicketId,
    source: "hand-written",
    suggestedAt: "2026-11-02T16:48:20Z",
    // Unsure both ways: category under 60% and 7 points clear; urgency 6 points clear.
    category: { value: "How-to", confidence: 0.48, runnerUp: { value: "Cancellation risk", confidence: 0.41 } },
    urgency: { value: "Normal", confidence: 0.62, runnerUp: { value: "High", confidence: 0.56 } },
    evidence: [
      { quote: "how to export everything we have in Ledgerline", supports: "category" },
      { quote: "whether the API can pull the same history", supports: "category" },
      { quote: "Our renewal is on 15 December", supports: "urgency" },
    ],
    draft: `Hi Aisha,

Thanks for checking before your renewal. You can export invoices, clients and payments from Settings → Export. Each comes as a CSV, and invoices include their PDFs in a zip.

The API can pull the same history: [link to the API guide].

Best,
Ledgerline Support`,
  },
  {
    // Sent by the "How-to questions" rule: How-to at 90% or more.
    ticketId: autoSendTicketId,
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

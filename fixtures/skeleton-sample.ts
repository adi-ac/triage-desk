/**
 * The shape of the Triage pane while a live triage is out (DESIGN.md,
 * Loading): a typical-length suggestion, rendered through the real Triage
 * components and drawn as a skeleton. Its words are never shown, only its
 * lengths count, and they're the recordings' medians: two category quotes
 * and one urgency quote, a 250-character AI note, a 500-character draft
 * with one placeholder, and an urgency that's a close call, so Approve's
 * summary has two things to resolve, as most answers do. Tuned against all
 * 37 recorded triage suggestions at 1280, 1024, 768 and 375, and checked
 * with Skullet's debug overlay (?skullet-debug), so the reveal barely moves
 * the layout (DESIGN.md, Loading and errors).
 *
 * Not model output, and not any visitor's data: the one hand-written
 * suggestion in the project, and only ever a skeleton.
 */

import type { TriageSuggestion } from "@/lib/suggestion";

export const skeletonEmail = {
  subject: "Question about changing an invoice after it was sent",
  body: `Hi,

I sent an invoice to one of our clients last week with the wrong details on it. Can I change the invoice they already have?

Or do I need to cancel it and send them a new one instead?

The due date is next Friday and their accounts team always pays on the day it's due, so I'd like to sort it out before then.

Thanks`,
};

export const skeletonSuggestion: TriageSuggestion = {
  ticketId: "skeleton",
  source: "hand-written",
  suggestedAt: "2026-11-09T00:00:00Z",
  kind: "triage",
  category: { value: "How-to", confidence: 0.7, runnerUp: { value: "Billing", confidence: 0.2 } },
  urgency: { value: "Normal", confidence: 0.6, runnerUp: { value: "High", confidence: 0.5 } },
  evidence: [
    { quote: "Can I change the invoice they already have?", supports: "category" },
    { quote: "Or do I need to cancel it and send them a new one instead?", supports: "category" },
    {
      quote:
        "The due date is next Friday and their accounts team always pays on the day it's due, so I'd like to sort it out",
      supports: "urgency",
    },
  ],
  agentNote:
    "The help center explains how to correct a sent invoice, but not whether the client is notified of the change. Check whether the invoice has been paid before suggesting that they cancel it, and confirm the due date with them if it moves. If it has been paid, a credit note may be the better route.",
  draft: `Hi,

Thanks for getting in touch before the due date, and for spotting the mistake.

[How to correct an invoice that has already been sent.]

Once the corrected invoice is out, your client will only see that one as due, so there's no risk of them paying the old one by mistake. Their accounts team can pay on Friday as planned.

If the client has already downloaded the old invoice, it's worth letting them know a corrected one is on its way.

Best,
Ledgerline Support`,
};

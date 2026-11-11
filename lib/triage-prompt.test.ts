/**
 * Agent notes with output-format debris the model leaked into them
 * (lib/triage-prompt.ts, cleanAgentNote): `pnpm test`. The six notes are
 * the recordings' own, as they were before the fixture was cleaned.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { categories, urgencies } from "./suggestion.ts";
import { cleanAgentNote, toSuggestion } from "./triage-prompt.ts";

const leaked: { ticket: string; note: string; clean: string }[] = [
  {
    ticket: "LL-5002 (Triage anyway)",
    note: "This is an out-of-office auto-reply with no ask, so the category is a low-confidence best fit that I was asked to give. You can probably close it without sending the draft.}}**Note:** the JSON above has a stray extra brace; use the single-line object below instead.{",
    clean:
      "This is an out-of-office auto-reply with no ask, so the category is a low-confidence best fit that I was asked to give. You can probably close it without sending the draft.",
  },
  {
    ticket: "LL-5004",
    note: "Draft invoices aren't currently shown in the Outstanding total as far as the help center says, but I couldn't confirm that from the articles. Please verify before sending, and log the request with the product team if appropriate.}",
    clean:
      "Draft invoices aren't currently shown in the Outstanding total as far as the help center says, but I couldn't confirm that from the articles. Please verify before sending, and log the request with the product team if appropriate.",
  },
  {
    ticket: "LL-5008",
    note: "The help center has nothing on deleting or anonymising client personal data while keeping invoices, so please confirm with the product or compliance team what Ledgerline supports. If it can't be done, this is really a feature request. Katrin's one-month deadline from 20 October falls around 20 November, so reply quickly.}",
    clean:
      "The help center has nothing on deleting or anonymising client personal data while keeping invoices, so please confirm with the product or compliance team what Ledgerline supports. If it can't be done, this is really a feature request. Katrin's one-month deadline from 20 October falls around 20 November, so reply quickly.",
  },
  {
    ticket: "LL-5025",
    note: "Likely a PDF font/encoding issue with Polish diacritics, so please escalate to engineering with the examples from the email. The customer has clients rejecting invoices, so consider asking for a workaround to offer them.}",
    clean:
      "Likely a PDF font/encoding issue with Polish diacritics, so please escalate to engineering with the examples from the email. The customer has clients rejecting invoices, so consider asking for a workaround to offer them.",
  },
  {
    ticket: "LL-5027",
    note: "Escalate right away and check the account's ownership-transfer and identity-verification process. The help articles don't cover ownership transfer or an activity log, so confirm both before replying.}</br>",
    clean:
      "Escalate right away and check the account's ownership-transfer and identity-verification process. The help articles don't cover ownership transfer or an activity log, so confirm both before replying.",
  },
  {
    ticket: "LL-5032",
    note: "This is a repeat of LL-4977, where Joel attributed the shortfall to card fees, but Hannah's figures (£96.20 fees vs £412.80 short, and £388.15 short on 20 Oct) don't support that. Please confirm the payout report attachment came through and consider escalating to whoever handles the Stripe integration, since her month-end close is blocked.}",
    clean:
      "This is a repeat of LL-4977, where Joel attributed the shortfall to card fees, but Hannah's figures (£96.20 fees vs £412.80 short, and £388.15 short on 20 Oct) don't support that. Please confirm the payout report attachment came through and consider escalating to whoever handles the Stripe integration, since her month-end close is blocked.",
  },
];

describe("cleanAgentNote", () => {
  for (const { ticket, note, clean } of leaked) {
    test(`${ticket}: ends at its last real sentence`, () => {
      assert.equal(cleanAgentNote(note), clean);
    });
  }

  test("a clean note is unchanged", () => {
    const note = "Escalate right away. Confirm both before replying.";
    assert.equal(cleanAgentNote(note), note);
  });

  test("null stays null", () => {
    assert.equal(cleanAgentNote(null), null);
  });

  test("nothing left before the first leaked character: no note", () => {
    assert.equal(cleanAgentNote("}"), null);
    assert.equal(cleanAgentNote("  {\"agentNote\": null}"), null);
    assert.equal(cleanAgentNote("<br>"), null);
  });

  test("it cuts at the first of {, } or <, and trims", () => {
    assert.equal(cleanAgentNote("Check the plan < before replying."), "Check the plan");
    assert.equal(cleanAgentNote("Check the plan.  {"), "Check the plan.");
  });
});

describe("toSuggestion cleans the agent note", () => {
  const output = (agentNote: string | null) => ({
    kind: "triage",
    notARequest: null,
    category: { value: categories[0], confidence: 0.9, runnerUp: { value: categories[1], confidence: 0.05 } },
    urgency: { value: urgencies[0], confidence: 0.9, runnerUp: { value: urgencies[1], confidence: 0.05 } },
    evidence: [],
    draft: "Hi, thanks for writing in.",
    agentNote,
  });

  test("a leaked note is cut back", () => {
    const result = toSuggestion(output(leaked[4].note), { model: "test", forced: false });
    assert.equal(result.problem, undefined);
    assert.equal(result.suggestion?.agentNote, leaked[4].clean);
  });

  test("a note that's only debris is left out", () => {
    const result = toSuggestion(output("}</br>"), { model: "test", forced: false });
    assert.equal(result.problem, undefined);
    assert.equal(result.suggestion?.agentNote, undefined);
  });
});

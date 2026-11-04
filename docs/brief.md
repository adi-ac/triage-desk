# Triage Desk: product brief

From a product-thinking interview on 2026-11-02. The interview covered why the piece exists, what to build and how to test it. It stopped before the last phase, how it wins.

## The one good idea

The interface makes it obvious when the model shouldn't be trusted.

Making every human decision visible ("pencil vs. ink") is how that works, not a second idea to pitch alongside it.

## Who it's for

The design lead or head of design at a mid-size B2B SaaS company adding AI to a workflow where people make decisions all day: support, sales ops, finance ops. Intercom, Plain and Front are stand-ins, not targets yet.

Their bad moment: portfolio after portfolio with an "AI copilot" case study that's a chat sidebar on a perfect mockup. They can't tell whether the candidate has thought about what happens when the model is wrong, unsure or missing information, so they skim for a minute and close it.

Their workaround: filtering for candidates who've shipped AI features. That proxy is crude, and it rules out designers who haven't shipped AI yet. This piece has to give the same signal faster and more reliably than the proxy.

## Why this instead of a shipped case study

A shipped case study tells them about decisions after the fact, usually under NDA, with the edge cases shaped by a team and a deadline. This is a working tool they can try to break in the first minute. Every failure-mode decision in it is mine, and they can check it rather than take my word for it.

What it can't claim is real-world use, so it gets tested with support agents and the write-up shows what broke.

## Decisions

**First screen**
- The link opens straight onto a ticket where the model is unsure. Approve is blocked with the reason beside it, the runner-up is offered, and the evidence is highlighted in the email. There are zero steps to the idea and one click to override.
- The example tickets are real outputs recorded from the model and labeled as recorded. An unlabeled canned example would undo the honesty claim the piece rests on.

**Minute two**
- Visitors can paste their own email, which calls a live model through my backend. There's a per-visitor limit and a daily spend cap. When the cap is hit, the page says so and falls back to the recorded examples.

**Where automation stops**
- Auto-send above a confidence threshold breaks in B2B support. One confident but wrong answer about a billing change or a data export can cost the account, and confidence doesn't measure what's at stake.
- The line is drawn on stakes first, then confidence. Teams set rules for what may be sent without review (for example, how-to questions above 85% confidence with no billing or account data). Anything touching money, contracts, access or customer data always needs a person.
- Every ticket shows which side of the line it falls on and why.
- One ticket in the inbox went out without review under a team rule. It shows the rule that allowed it, an entry in the activity timeline and an undo window. **If I can't build that well, I cut the stakes-line claim instead of describing it.**

**What it's not leading with**
- The system underneath (trust signals as tokens and typed components, so "AI suggested vs. person decided" holds on every screen by construction). It rewards someone in minute ten, but nobody opens a repo in a sixty-second skim.

**Look** (decided 2026-11-02 in a throwaway tuning page at `/prototype/look`, now deleted)
- Accent: Petrol, hue 215. Light mode uses `petrol-700` for the accent and `petrol-100` for its soft fill; dark mode uses `petrol-300` and `petrol-900`.
- Grays: neutral, with no tint (chroma 0).
- Fonts: Schibsted Grotesk for headings, Geist for body text, Geist Mono for IDs, times and figures.
- Palette method unchanged: one lightness table for every ramp, one chroma target per step, capped at 95% of each hue's sRGB ceiling. Status colors stay amber 65, red 27 and green 150.
- Contrast: all 41 checked pairs pass WCAG AA and APCA in both themes. Neutral grays left dark-mode `ink-3` on `surface-2` at Lc 59.9, so dark `ink-3` moved to a new `gray-275` (L 0.78, Lc 61.7).
- Replaced: the v1 look of teal 192 with grays tinted toward teal, set in Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono. The other accents on the panel (Pine, Blue, Indigo, Violet, Plum) and the cool and warm grays were also not chosen. My reasons, recorded 2026-11-03:
  - Accent: "I wanted a distinct hue other than blue, indigo, and violet which have become overused in products as of late. Teal and plum felt a bit too close to success and error state colors, respectively."
  - Grays: "I wanted a more neutral look for the grays compared to the tinted variants."
  - Fonts: "The v1 set of Bricolage Grotesque, IBM Plex Sans and IBM Plex Mono typefaces have gotten used a lot more in the recent years and I wanted to use a set that was more opinionated and non-generic yet distinct enough. That's why I went with Schibsted Grotesk, Geist and Geist Mono."
- Known trade-off: a violet accent and warm grays each failed one dark-mode pair on the panel; neither was picked, so neither needed fixing.

**Surfaces** (decided 2026-11-03 in a throwaway tuning page at `/prototype/surfaces`, now deleted, referencing Clerk's dashboard)
- Three elevation levels, no more: panes, popovers and menus, dialogs. Shadows and button fills are in `styles/elevation.css`; the new surface roles (`page`, `tray`, `surface-raised`, `scrim`) are in `theme.css`.
- Tray and card: a gray band holds each pane's header and wraps a white card.
- Light-mode page, changed 2026-11-03 from white (`gray-0`) to `gray-25`, so white surfaces stand out from it. My reason: "white surfaces blended into the white page." The tray stays `gray-50`, a step darker than the page, so it still reads against both the page and the white cards. Every text role passes on the new page and tray (lowest: `ink-3` on the tray at 4.82:1 / Lc 70). The pane shadows read the same on gray. Dark mode is unchanged.
  - Also tried: page `gray-50` with the tray at 30% `gray-100`. Its cards sat twice as far from the page, but `ink-3` on that tray was down to 4.61:1. I chose `gray-25` and `gray-50` after comparing both on `/system`.
- Shadows: a tight layer under the edge plus a wide soft one, at 0.7× the prototype's starting softness and 0.9× its strength.
- Light-mode hairline ring, added 2026-11-03, mirroring dark mode's white rings: each level starts with a black hairline ring at 6% (pane), 8% (popover) and 10% (dialog), then the soft shadow. My reason: white surfaces blended into the page without it. The ring is meant to only just separate a white surface from the gray page: at 2× density the pane ring is 1.14:1 against the page, fainter than a `line` divider. Buttons keep their own edge and don't take the pane's ring, so they're unchanged.
- Fainter light-mode shadows, changed 2026-11-03. Each level keeps its ring and every offset and blur, but the soft layers' opacities drop: pane 4.5% and 6.3% → `#00000003` and `#00000005`; popover 5.4% and 10.8% → `#00000004` and `#00000008`; dialog 7.2% and 18% → `#00000005` and `#0000000e`. My reason: the much fainter shadows are more pleasing to the eye than the earlier iteration and the no shadow option. Buttons keep the earlier soft layers (now `--shadow-button-soft`), so they still read as pressable; dark mode has no shadows and is unchanged.
- Buttons are raised. Secondary buttons have an edge and the pane shadow. The primary button has a gradient (the accent with 12% white at the top), a lighter top edge, a darker accent ring and the pane shadow. Text on the gradient's lightest point is 5.46:1 / Lc 82 in light and 10.4:1 / Lc 69 in dark.
- Subtler primary hover, changed 2026-11-04 after previewing it on `/system`. The hover used to go a full step further (`petrol-800` in light, `petrol-200` in dark); now it shifts a little the opposite way. Its base, `accent-hover`, is the accent mixed 30% toward `petrol-600` in light mode and 30% toward `petrol-400` in dark mode (`color-mix` in oklch). The gradient shape stays the same, with 12% white at the top. My reason: the full-step hover was too strong; a subtle shift doesn't pull attention for a brief, repeated state change. Text on it is 5.00:1 / Lc 80 at the lightest point in light mode (6.50:1 at the base) and 8.75:1 / Lc 61 at the darkest point in dark mode (9.78:1 at the top). Dark mode's base only just clears the Lc 60 bar.
- Disabled buttons are flat at every depth and sunk to `bg`, so the blocked Approve doesn't look pressable.
- Dark mode has no shadows. Levels step lighter (`surface` for panes, `gray-950` for popovers and dialogs) and carry white hairline rings. The panel's hairline switch was off, which also dropped the dark rings; they were kept because the rule for dark mode was lighter surfaces and borders.
- Not chosen: decisions a person made sitting raised while AI suggestions stay flat. Both stay flat; a decision has a solid accent border and a suggestion a dashed `line-strong` one (see Trust signals). My reason, recorded 2026-11-03: "The raised variants seemed to blend in with the rest of the buttons."

**Trust signals** (decided 2026-11-03; tokens in `styles/trust.css`, shown with live contrast checks at `/system`)
- Every token points at an existing role, so light and dark come from `theme.css` and nothing new needs its own dark value.
- One color family per meaning: gray and dashed for the model (suggestions and the evidence it quotes), petrol and solid for a person (decisions, the same accent as Approve), amber for uncertainty, red for urgency. Petrol also marks high confidence (see Confidence below) and the selected queue item (see Components).
- Pencil, a suggestion not yet acted on: dashed `line-strong` border, `bg` fill, `ink` text.
- Ink, a person's decision: solid `accent` border, `accent-soft` fill, `accent-text` text.
- Both are flat at every level. Raised means pressable, and a decision is a record, not a button.
- Evidence: a fill plus a dashed underline, because the model made the mark. Category uses `line` with an `ink-3` underline (`line-strong` was 2.98:1 on the fill); urgency uses `critical-soft` with a `critical` underline. The evidence list names which is which, so color isn't the only cue.
- Confidence: high is petrol (an `accent` meter, `accent-text` text). Medium turns the meter `warning`; low adds `warning` text on a `warning-soft` fill. High confidence is never green.
  - Changed 2026-11-04 from a quiet gray high (an `ink-3` meter, `ink-2` text), which was meant to send attention to the cases where the model shouldn't be trusted. Medium and low are unchanged. My reason: "It's the brand color, so screens feel calm and on-brand rather than grey. Most tickets will be high confidence, so this sets the overall feel. It gives a clear three-color scale (Petrol, amber, amber with fill) without green's 'this is correct' message. There's a coherent story: Petrol means 'fine to go ahead' and amber means 'check this', and Approve is Petrol too."
  - Trade-off: high confidence now shares its color with a person's decisions and with Approve, so petrol no longer means only "a person did this". A high-confidence meter and a decision are told apart by shape and words, not color: the meter is a bar with its "High confidence" label, and a decision is a solid-bordered chip on an `accent-soft` fill.
  - Contrast, re-checked in both themes: high-confidence text is at least 6.59:1 / Lc 79 in light (on `bg` and the tray) and 10.76:1 / Lc 76 in dark (on `surface-2` and `surface-raised`); the meter is 5.65:1 on its track in light and 7.08:1 in dark. All pass (text 4.5:1 and Lc 60, meter 3:1).
- Severity: urgent is the only solid fill (`surface` text on `critical`); high is `critical` on `critical-soft`; normal and low have no fill (`ink-2`, `ink-3`). Bars repeat the level without color, and every level carries its word.
- Contrast: all 21 trust pairs pass in both themes (text 4.5:1 and Lc 60, non-text 3:1). The tightest is the pencil border on its own fill in light mode, at 3.48:1.

**Components** (built 2026-11-04 in `components/ui`, shown at `/system` in light and dark side by side)
- Eleven base components: Button, Tag, Chip, ConfidenceMeter, EvidenceItem, TimelineRow, Banner, QueueItem, DraftEditor, SegmentedControl, Severity. Variants are TypeScript unions. No component takes `className` or `style`, and every color is a token from `styles/`, so a screen can't restyle the trust language.
- High confidence and decisions share petrol, so the components keep them apart by shape and words. A ConfidenceMeter is always a bar, a percentage and a level word, with no border; it has no chip form. A decided Chip always has a solid border and names who set it: the types reject `state="decided"` without `decidedBy`. `/system` shows a high-confidence meter next to a decided chip in both themes so this can be checked by eye.
- Confidence thresholds, confirmed 2026-11-04: high from 85% (the team-rule example above), medium from 60%, low below. ConfidenceMeter derives the level from the rounded percentage, so the figure and the word never disagree.
- Reviewed 2026-11-04:
  - Button defaults to secondary. Agreed.
  - Danger is red text on secondary chrome, not a red fill, and the info banner is gray. My reason: they shouldn't outweigh Approve. Secondary and danger hover use a new `--button-bg-hover` token (`bg` in light, `ink` at 12% in dark).
  - The selected QueueItem is a petrol tint (`accent-soft`) with no bar on the leading edge, changed from a gray step with a gray bar. My reason: the tint makes it easier to see which ticket I'm working on, and the bar added weight without adding information. On the selected row the company name and time use `ink-2`, because `ink-3` on `accent-soft` is 4.18:1 in light and Lc 59.1 in dark, which fails; `ink-2` is 5.93:1 / Lc 71 in light and 8.88:1 / Lc 73 in dark. Petrol now marks the selected queue item as well as decisions, high confidence and Approve.
  - Banners have no colored edge in any tone. My reason: the title already says the tone in words and the fill carries the color, so the edge was redundant weight.
  - The info banner keeps a hairline ring (`line`), restored 2026-11-04 after briefly removing it; warning and error have no ring. My reason: the "Recorded example" label must be noticed, and without the ring the info fill (`surface-2`) was only 1.04:1 against a white card in light mode (1.09:1 in dark). The ring is 1.27:1 against the card in light and 1.28:1 in dark, the same as a `line` divider.
- DraftEditor states, added 2026-11-04: `suggested` (the model's untouched draft, dashed pencil border), `edited` (a person changed it, solid border; a suggested draft switches on the first keystroke) and `approved` (read-only, decided style). The label names the state and the note says who drafted it in every state. This closes the gap where a model draft couldn't render as a suggestion. Text is at least 14.16:1 in light and 12.82:1 in dark in every state; the approved border is 7.19:1 against the surface in light and 9.05:1 in dark.
- Severity component, added 2026-11-04 from the existing severity tokens (`level`: urgent, high, normal, low). It replaces the hand-built demo on `/system`. Text passes in both themes (lowest: low at 5.25:1 / Lc 76 in light, 9.02:1 / Lc 63 in dark).
- Themes can now be scoped to any element with `data-theme`, not just `<html>`. Derived tokens (button fills, shadows, trust tokens) are re-declared on `[data-theme]` so they follow the scope. Values are unchanged.
- Contrast: every new pair passes in both themes. Checking them showed that `ink-3` doesn't pass on any soft fill (4.08–4.21:1 in light, Lc 59.1–59.6 in dark), although `theme.css` said it did. Text on soft fills uses `ink-2` (at least 5.80:1 / Lc 69), and the `theme.css` note is corrected. The old `/system` confidence demo had put `ink-3` on the low-confidence fill; ConfidenceMeter uses `ink-2`.

**Approve, approval records and example output** (decided 2026-11-04, after the first docs test showed an agent had to invent these)
- Approve is blocked by exactly three things: a field that no one has kept or switched and that is unsure (under 60%, or within 15 points of its runner-up); any unfilled `[placeholder]` in the draft; an empty draft. A draft written for a value a person has since overridden is a warning beside the draft, not a blocker. The 0.15 margin from the early copy ("the top two categories are 0.07 apart") means top pick vs runner-up, so it stays, as the second way a field is unsure; figures are compared as the rounded percentages shown. My reason: block only where a wrong send is costly. The rules live in `lib/approve.ts` (`approveBlockers`), so no screen writes its own.
- Approving doesn't turn untouched fields into "Set by you". They become decided and are labeled "Approved as suggested" (`Chip asSuggested`), and the timeline gives them their own rows, separate from fields a person changed. My reason: the record must never claim a person chose something they didn't look at.
- Example output has three labeled sources: recorded, live and hand-written (`OutputSource`, fixed wording). Hand-written is allowed during the build only, shows as a warning, and must be replaced by recorded output before shipping. LL-5040 stays hand-written until the API key is added. This extends the First screen decision that recorded examples are labeled as recorded. Update 2026-11-04: LL-5040 and the vague email are now recorded (`claude-sonnet-5-5`, 4 November 2026), replacing the hand-written LL-5040.
- Gaps closed from the same test: the in-email evidence highlight is a component (`EvidenceMark`), used on `/system` and by EvidenceItem. ConfidenceMeter wraps instead of scrolling sideways on a phone, and drops "confirm before approving" once a field is kept or switched (`confirmed`). DESIGN.md now has pane layout rules and a `Pane` component.
- Not yet reviewed (my picks for the layout, to confirm): from 1200px the shell is three columns (queue 320px, email, triage 400px) with each pane scrolling on its own; from 768px it's email and triage (360px), with the queue behind a "Queue" button; below 768px it's one column, email then triage. Pane corners come from the surfaces prototype: 14px tray, 4px padding, 10px card.

**Overriding a field and sending** (decided 2026-11-04, after the second docs test showed each agent inventing its own)
- Overriding a field is one component, `FieldReview`. While suggested it shows small secondary "Keep", "Switch to <runner-up>" and "Other…" (the full list); once decided, the solid decided chip and a quiet "Change" link that reopens it. My reason: the override must be one click, and these controls must never compete with Approve.
- After sending, the Approve button is replaced by a sent line ("Sent by you · <time>") and a "Next ticket" button; the draft becomes approved and read-only, and a timeline row is added. "Never hide Approve" applies until the reply is sent.
- Gaps closed from the same test: DESIGN.md now shows the shell with and without the queue column (a single ticket opened from a link drops the queue column and isn't an exception). Model output has one shared type, `Suggestion` in `lib/suggestion.ts`, used by `fixtures/suggestions.ts` (LL-5040, hand-written) and by the components. Screens import only from `@/components/ui`, and ESLint rejects a component's own file path.
- The category list behind "Other…" is How-to, Billing, Bug, Feature request and Cancellation risk, the five the fixtures' notes use; urgency uses Severity's four levels. LL-5040's hand-written numbers follow the early `/system` copy: How-to 48% vs Cancellation risk 41%, and Normal 62% vs High 56%. Confirmed 2026-11-04. Superseded 2026-11-04: LL-5040 is now recorded output (Cancellation risk 50% vs How-to 42%; High 50% vs Normal 38%), so the hand-written numbers are gone.

**Approve placement, time and the meter after a decision** (decided 2026-11-04, after the third docs test)
- Approve placement: Pane has a `footer` slot pinned at the bottom of the card. The triage pane puts Approve there (`ApproveBar`), with a one-line blocker summary ("3 things to resolve: Category, Urgency, Draft") whose items jump to the field. The full blocker list stays in the card. No negative margins. My reason: Approve must always be visible without layout hacks.
- Time: `Suggestion` has a `suggestedAt` time. Times show in the viewer's time zone through one `Time` component: the time alone for today, the date and time for anything older, and the full timestamp with its zone on hover.
- No queue: when a ticket is opened on its own, "Next ticket" becomes "Back to inbox".
- Meter after a decision: confidence belongs to suggestions. Once a field is kept or switched, the meter is replaced by a quiet note, "Claude suggested <pick> · <n>%". My reason: a meter beside a value must never show confidence in a different value. A field approved untouched keeps its meter, since it's still showing confidence in the value beside it.
- Kept as they are: LL-5040 at How-to 48% vs Cancellation risk 41%, and the five categories (How-to, Billing, Bug, Feature request, Cancellation risk), both now confirmed. (Superseded 2026-11-04 by the recording: Claude picks Cancellation risk 50% over How-to 42%. The ticket is unsure either way, which is what the first screen needs.)
- Gaps closed from the same test: the Pane example no longer puts an unconfirmed urgency in a header (it broke rule 1), and finding and marking quotes in the email is one component, `EmailBody`, backed by `lib/evidence.ts`.

**The inbox, the first screen** (decided 2026-11-04, while building it from DESIGN.md)
- Route: each ticket has its own URL inside the inbox, `/tickets/[id]`; `/` redirects to `/tickets/LL-5040`.
- The queue lists all 40 tickets. Triaged tickets come first, sorted by stakes first, then confidence. Stakes are derived from the fields, not stored: high if the category is Billing or Cancellation risk or the urgency is Urgent, counting the runner-up as well as the top pick, and using a person's value once they decide a field. Within each, the least sure first (the lowest confidence of any undecided field). My reason: when Claude is unsure, assume the higher stakes, so a likely cancellation can't sink just because the model's top guess was How-to. LL-5040 lands at the top. Update 2026-11-04: with LL-5040 recorded, it still tops the queue while the other tickets are untriaged; a full recording of all 40 would put it fifth (see "Recording all 40").
- Tickets without model output go in their own "Not triaged yet" group below, newest first, each with a neutral "Not triaged" Tag. Opening one shows the email and a triage pane that says plainly Claude hasn't triaged it yet, with no Approve: the one exception to "never hide Approve".
- LL-5039 shows its "Sent by rule" marker and has hand-written output that meets its rule ("How-to questions": How-to, confidence 90% or higher). Opened, it's a read-only sent record: fields stay pencil, the draft is read-only, the timeline shows the Model and Team rule rows, an info Banner names the rule and its condition, and the footer reads "Sent by rule · <time>" with Next ticket. No decision styling, since no person acted: no ink chips, no "Set by you". (Reworded 2026-11-04 from "no Petrol anywhere": its high-confidence meters stay Petrol, because rule 4 stands and the meter describes the model's confidence, not a decision. My reason: an exception for one ticket type is a rule future agents will miss.)
- Below 1200px the Queue button opens a dialog-level sheet from the left (surface-raised, dialog shadow, scrim), with the current ticket highlighted and scrolled into view. It closes when a ticket is picked or on Escape; focus moves into it and back to the Queue button. Full width on phones.
- Triage pane, top to bottom: Category, then Urgency, each with its own evidence directly beneath it (hovering or focusing a quote marks it in the email: the dashed underline turns solid and 2px, and it scrolls into view if needed, instantly with reduced motion). Then the draft, then the activity timeline, collapsed with a count ("Activity · 3"). Approve is pinned in the footer with the blocker summary.
- No separate blocker list. Each blocker shows where it's fixed: the unsure field's hint, the highlighted placeholders in the draft (amber fill, dashed amber underline), the empty draft's message; the footer summary links to each. This replaces the earlier rule that the full list stays in the card. My reason: the reason should sit where you fix it, not in a list you read in one place and act on in another.

**Queue behavior** (decided 2026-11-04, after building the first screen)
- The open ticket keeps its place in the queue while you work on it; the queue re-sorts only when you open a different ticket or reload. My reason: a row must never move out from under the person working on it.
- Queue groups, top to bottom: Needs review (the stakes sort), Not triaged yet (newest first), Sent (sent by you or by a rule, most recently sent first). Each sent ticket keeps its "Sent" or "Sent by rule" Tag. This replaces "triaged tickets first", which mixed sent tickets in with ones still needing review.
- The browser tab title is "<ticket ID> · Triage Desk", set on the client, because reading the ID on the server would block instant navigation.

**Model output: the note, shared quotes, and what confidence means** (decided 2026-11-04, after the first recording runs)
- Confidence is Claude's own estimate, not a measured probability. The first runs reported round numbers (40, 45, 50, 60%), and nothing yet checks them against outcomes. The interface says "Claude's estimate" once per triage pane, under the first meter ("Confidence is Claude's estimate, not a measured probability."), and every meter's accessible name says it too; there's no hover-only explanation.
- Placeholders are only for facts Claude can't know: dates, amounts, names, account details. Advice to the support agent never goes in the draft. It goes in an optional `agentNote` on Suggestion, shown above the draft as an info Banner titled "Claude's note". The recording prompt says the same. Prompted by a run that left "[Agent: consider looping in the account manager.]" in a draft.
- One quote can support both the category and the urgency. EmailBody marks it once, in urgency red (red already means it raises the stakes), and the evidence item under either field highlights that mark.
- Category and urgency definitions, for review. Copied from the recording prompt (`scripts/record-suggestion.ts`), which is the source; change them there and here together.
  - Categories:
    - How-to: the customer wants to know how to do something Ledgerline already supports.
    - Billing: Ledgerline's own charges to the customer: their plan, subscription, payments to Ledgerline, or invoices Ledgerline sent them.
    - Bug: something in Ledgerline is broken or behaving wrongly.
    - Feature request: the customer wants something Ledgerline doesn't do.
    - Cancellation risk: signs the customer may leave or not renew: renewal doubts, reviewing tools, moving data out, comparing alternatives.
  - Urgencies:
    - Urgent: money, access or data is at risk right now, or a hard deadline is days away.
    - High: a near deadline or a blocking problem for the customer's work.
    - Normal: a real need with no pressing deadline.
    - Low: curiosity or a nice-to-have.

**Drafts grounded in the help center** (decided 2026-11-04)
- Drafts are grounded in the help center, not guessed. `fixtures/help-center.ts` holds six short fictional Ledgerline articles (data export, the API, invoices and billing, plan changes, cancelling, passwords and access), and the recording prompt includes them. A draft may state only facts found in the email or these articles; anything else is a placeholder. Each article a draft relies on is recorded as evidence with the article's title and the sentence it relies on (`ArticleEvidence`), separate from the email quotes that back the category and urgency.
- Placeholders are never used inside a question to the customer; the question is asked in plain words. Prompted by a vague-email draft that asked "which invoice is it (the invoice number, [invoice number], or the date is fine)?".
- The dev-only Next.js warning that `app/tickets/layout.tsx` and `app/system/page.tsx` were "dropped" from instant-navigation validation comes from the Anthropic SDK, not from either file. `@anthropic-ai/sdk` depends on `@opentelemetry/api`, an optional peer of Next.js, so installing the SDK made pnpm resolve Next with OpenTelemetry, and that build's dev validator reports those segments as unrendered. The same code without the SDK shows no warning. The pages render and behave the same either way.

**Recording all 40** (4 November 2026, `claude-sonnet-5-5`, one run each)
- LL-5040 and the vague email are saved as recorded examples in `fixtures/recorded-suggestions.json`, replacing the hand-written LL-5040. Drafts now use a greeting line, short paragraphs and a sign-off on their own lines.
- The other 39 tickets were recorded once but not yet saved into the fixtures, pending two decisions:
  - LL-5040 would no longer top the queue; it would be fifth. Three of the four tickets above it aren't requests (an out-of-office auto-reply, a three-word body with no subject, a reply from a customer's client); the category list has no "nothing to triage" option, so Claude forces a low-confidence pick, and the stakes rule (runner-up counts) plus "least sure first" floats them up. The fourth, LL-5017, is plausibly right to be there.
  - Two email quotes (LL-5002, LL-5009) quote the subject line, which the prompt shows Claude but evidence matching doesn't check, so screens would drop them.
- 26 of 40 came back unsure (14 on category, 18 on urgency). No article quote failed to match, no placeholder sat inside a question, and no draft carried advice to the agent. One first attempt cited the draft without an article and was rejected and re-run. LL-5039's recording meets its rule (How-to 96%).

**Focus ring** (decided 2026-11-03): the accent, 2px with a 2px offset, set globally on `:focus-visible` via a `--focus-ring` role. It is at least 6.59:1 on `surface` and `bg` in both themes.
- The one documented exception to the Petrol rule (Petrol is only for decisions, high confidence, the selected queue item and Approve), confirmed 2026-11-04. My reason: keyboard focus must always be clearly visible, and it only appears while tabbing, so it never competes with Approve.

## Chain of must-be-trues

1. **← testing now.** A design lead opens the link and, within 60 seconds and with no instructions, sees the model be unsure and the interface stop it: Approve blocked, the reason beside it, the runner-up offered.
2. They conclude "this person designs for when the AI is wrong, and has a view on where automation should stop", not "nice demo".
3. That's a stronger signal than "has shipped AI", so they'll talk to me without shipped AI work. This is the link I'm least sure of.
4. In the interview, the depth holds up: why the line is drawn on stakes before confidence, the system underneath, and what broke when support agents used it.

### Test for link 1

As soon as the first screen works, before any polish, three people open the link cold on a call. I stay quiet for the first minute, then ask "What do you think this person cares about?"

- **Pass:** at least two of three mention, without prompting, the model being unsure or the interface catching it.
- **Fail:** I fix the first screen before building anything else.

## Biggest unanswered risk

**Link 3.** Will a design lead talk to me without shipped AI work, on the strength of this piece? The only way to find out is with real hiring managers, and the test isn't designed yet.

Proposed shape for the test (not yet agreed):
- Send it only to companies with an open product design role on an AI workflow, through an application or a warm intro, never a cold DM.
- Use a separate link per recipient, so "never opened" is distinguishable from "opened and passed", along with how long they stayed.
- Baseline: my response rate on the last ten applications with my old portfolio.
- Agree the pass mark before sending, for example at least twice the baseline among people who opened it.
- If they open it, stay more than a minute and don't reply, links 2 or 3 failed, not distribution. Ask two of them why.

## This month (November 2026)

**Build at 100%: link 1.**
- The first screen: the unsure ticket, blocked Approve with its reason, the runner-up, evidence highlighted in the email.
- Recorded examples, labeled as recorded.
- Then run the cold-open test, and fix the first screen until it passes.

**Half-build on purpose.**
- The auto-sent ticket: one ticket, the rule, the timeline entry, undo. Enough to be real, not a rules editor.
- Paste-your-own with the live model: working, rate-limited, spend-capped, no polish.
- The token and component system: it should exist and be consistent, but don't polish it before link 1 passes.
- Visual polish and motion: after link 1 passes.

**Not this month.**
- Testing with support agents. That's link 4, and it can't rescue a failed link 1.

## Principles the idea currently violates

- **4. A named person.** The audience is a role with stand-in companies. No real design lead has been named to put this in front of.
- **6. One good idea.** Link 1 as first written put the unsure ticket and the auto-sent ticket "in the same view", which is two stories in sixty seconds. Show the auto-sent ticket as a small "Sent by rule" marker in the inbox that opens on a click, not as a competing focal point.
- **5. Signal, not finding.** If the three link-1 testers are friendly designers, a pass means little. At least one should be someone who hires designers, and none should be invested in me doing well.
- **14. Engineer out every excuse.** The link-3 test has no channel, measurement or pass mark yet, so a weak result can be explained away.

## What the interview didn't resolve

- **Who the three link-1 testers are.**
- **The link-3 test design.** Above is a proposal, not a decision.
- **The first real design lead** to send it to, by name.
- **How it wins (phase 4), not covered at all.** Where the link lives and who sees it (portfolio, applications, posts), the positioning against other AI portfolio pieces, and what happens when helpdesk products ship this pattern themselves.
- **Real, messy input.** The example emails are invented (a fictional company, Ledgerline). Real support email has forwarded chains, signatures, several asks at once, and quoted replies that may break word-for-word evidence matching. Not discussed.
- **Which vague email reliably gets an unsure result** in minute two, so a skeptical reviewer sees the system catch a case I didn't choose for them.
- **Record real output for all 40 tickets** once the API key is added, so the "Not triaged yet" group shrinks to only genuinely new tickets.
- **Write a reply by hand** on a ticket Claude hasn't triaged, so a person is never blocked by the model.
- **"Triage now"** on an untriaged ticket in live mode, within the visitor limit and spend cap.
- **Undo send.** After a reply is sent there is no way to take it back. Not built yet; decide the window and what it undoes.
- **Whether the unsure examples are actually unsure.** Before building the triage panel, run LL-5040 and the vague email (`vagueEmail` in `fixtures/tickets.ts`) against the live model several times and confirm they come back unsure every time.
- **Long emails.** v1 cut emails off at 8,000 characters before sending them to the model, which loses the last section of LL-5033. Raise the limit, and when an email is still cut off, show the agent a note saying so.

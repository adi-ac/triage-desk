# TriageDesk: product brief

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
- The example tickets are real outputs recorded from the model. (Until 2026-11-05 they were also labeled as recorded in the interface; that label is gone, see "Header, theme and pencil". The recordings stay real model output, with their source in the data.)

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
- Not chosen: decisions a person made sitting raised while AI suggestions stay flat. Both stay flat; a decision has a solid accent border and a suggestion a dashed `line-strong` one (see Trust signals; the suggestion has no visible border since 2026-11-05). My reason, recorded 2026-11-03: "The raised variants seemed to blend in with the rest of the buttons."

**Trust signals** (decided 2026-11-03; tokens in `styles/trust.css`, shown with live contrast checks at `/system`)
- Every token points at an existing role, so light and dark come from `theme.css` and nothing new needs its own dark value.
- One color family per meaning: gray and dashed for the model (suggestions and the evidence it quotes), petrol and solid for a person (decisions, the same accent as Approve), amber for uncertainty, red for urgency. Petrol also marks high confidence (see Confidence below) and the selected queue item (see Components).
- Pencil, a suggestion not yet acted on: dashed `line-strong` border, `bg` fill, `ink` text. (Superseded 2026-11-05: a soft gray fill and no visible border; see "Header, theme and pencil".)
- Ink, a person's decision: solid `accent` border, `accent-soft` fill, `accent-text` text.
- Both are flat at every level. Raised means pressable, and a decision is a record, not a button.
- Evidence: a fill plus a dashed underline, because the model made the mark. Category uses `line` with an `ink-3` underline (`line-strong` was 2.98:1 on the fill); urgency uses `critical-soft` with a `critical` underline. The evidence list names which is which, so color isn't the only cue.
- Confidence: high is petrol (an `accent` meter, `accent-text` text). Medium turns the meter `warning`; low adds `warning` text on a `warning-soft` fill. High confidence is never green. (Low's fill removed 2026-11-05; see "Header, theme and pencil". Changed again 2026-11-05: medium now uses the same Petrol tokens as high, so amber is only for low, which blocks Approve; see DESIGN.md, ConfidenceMeter. Superseded the same day: the color follows whether the field blocks Approve; see "Confidence color follows the blocker".)
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
  - The info banner keeps a hairline ring (`line`), restored 2026-11-04 after briefly removing it; warning and error have no ring. My reason (2026-11-04; the label it was for was removed 2026-11-05, and the ring stays so info banners such as Claude's note stand out on a white card): the "Recorded example" label must be noticed, and without the ring the info fill (`surface-2`) was only 1.04:1 against a white card in light mode (1.09:1 in dark). The ring is 1.27:1 against the card in light and 1.28:1 in dark, the same as a `line` divider.
- DraftEditor states, added 2026-11-04: `suggested` (the model's untouched draft, dashed pencil border), `edited` (a person changed it, solid border; a suggested draft switches on the first keystroke) and `approved` (read-only, decided style). The label names the state and the note says who drafted it in every state. This closes the gap where a model draft couldn't render as a suggestion. Text is at least 14.16:1 in light and 12.82:1 in dark in every state; the approved border is 7.19:1 against the surface in light and 9.05:1 in dark.
- Severity component, added 2026-11-04 from the existing severity tokens (`level`: urgent, high, normal, low). It replaces the hand-built demo on `/system`. Text passes in both themes (lowest: low at 5.25:1 / Lc 76 in light, 9.02:1 / Lc 63 in dark).
- Themes can now be scoped to any element with `data-theme`, not just `<html>`. Derived tokens (button fills, shadows, trust tokens) are re-declared on `[data-theme]` so they follow the scope. Values are unchanged.
- Contrast: every new pair passes in both themes. Checking them showed that `ink-3` doesn't pass on any soft fill (4.08–4.21:1 in light, Lc 59.1–59.6 in dark), although `theme.css` said it did. Text on soft fills uses `ink-2` (at least 5.80:1 / Lc 69), and the `theme.css` note is corrected. The old `/system` confidence demo had put `ink-3` on the low-confidence fill; ConfidenceMeter uses `ink-2`.

**Approve, approval records and example output** (decided 2026-11-04, after the first docs test showed an agent had to invent these)
- Approve is blocked by exactly three things: a field that no one has kept or switched and that is unsure (under 60%, or within 15 points of its runner-up); any unfilled `[placeholder]` in the draft; an empty draft. A draft written for a value a person has since overridden is a warning beside the draft, not a blocker. The 0.15 margin from the early copy ("the top two categories are 0.07 apart") means top pick vs runner-up, so it stays, as the second way a field is unsure; figures are compared as the rounded percentages shown. My reason: block only where a wrong send is costly. The rules live in `lib/approve.ts` (`approveBlockers`), so no screen writes its own.
- Approving doesn't turn untouched fields into "Set by you". They become decided and are labeled "Approved as suggested" (`Chip asSuggested`), and the timeline gives them their own rows, separate from fields a person changed. My reason: the record must never claim a person chose something they didn't look at.
- (Superseded 2026-11-05: the interface no longer labels the source, and `OutputSource` is gone; see "Header, theme and pencil".) Example output has three labeled sources: recorded, live and hand-written (`OutputSource`, fixed wording). Hand-written is allowed during the build only, shows as a warning, and must be replaced by recorded output before shipping. LL-5040 stays hand-written until the API key is added. This extends the First screen decision that recorded examples are labeled as recorded. Update 2026-11-04: LL-5040 and the vague email are now recorded (`claude-sonnet-5-5`, 4 November 2026), replacing the hand-written LL-5040.
- Gaps closed from the same test: the in-email evidence highlight is a component (`EvidenceMark`), used on `/system` and by EvidenceItem. ConfidenceMeter wraps instead of scrolling sideways on a phone, and drops "confirm before approving" once a field is kept or switched (`confirmed`). DESIGN.md now has pane layout rules and a `Pane` component.
- Not yet reviewed (my picks for the layout, to confirm): from 1200px the shell is three columns (queue 320px, email, triage 400px) with each pane scrolling on its own; from 768px it's email and triage (360px), with the queue behind a "Queue" button; below 768px it's one column, email then triage. Pane corners come from the surfaces prototype: 14px tray, 4px padding, 10px card.

**Overriding a field and sending** (decided 2026-11-04, after the second docs test showed each agent inventing its own)
- Overriding a field is one component, `FieldReview`. While suggested it shows small secondary "Keep", "Switch to <runner-up>" and "Other…" (the full list; since 2026-11-05 an "Other" menu button with a caret, opening a popover `Menu` instead of an inline row, so the layout doesn't shift); once decided, the solid decided chip and a quiet "Change" link that reopens it. My reason: the override must be one click, and these controls must never compete with Approve.
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
- The browser tab title is "<ticket ID> · TriageDesk" (renamed from "Triage Desk" 2026-11-05), set on the client, because reading the ID on the server would block instant navigation.

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
- (Superseded the same day: all 40 were re-recorded from one prompt version and merged; see "Stakes, the queue top and the full recording".) The other 39 tickets were recorded once but not yet saved into the fixtures, pending two decisions:
  - LL-5040 would no longer top the queue; it would be fifth. Three of the four tickets above it aren't requests (an out-of-office auto-reply, a three-word body with no subject, a reply from a customer's client); the category list has no "nothing to triage" option, so Claude forces a low-confidence pick, and the stakes rule (runner-up counts) plus "least sure first" floats them up. The fourth, LL-5017, is plausibly right to be there.
  - Two email quotes (LL-5002, LL-5009) quote the subject line, which the prompt shows Claude but evidence matching doesn't check, so screens would drop them.
- 26 of 40 came back unsure (14 on category, 18 on urgency). No article quote failed to match, no placeholder sat inside a question, and no draft carried advice to the agent. One first attempt cited the draft without an article and was rejected and re-run. LL-5039's recording meets its rule (How-to 96%).

**Not a request** (decided 2026-11-04, after recording all 40 floated non-requests to the top of the queue)
- Claude can return "Not a request" instead of a category, with a short reason (auto-reply, empty, misdirected, nothing to do) and no urgency or draft. My reason: forcing a category on a non-request creates fake low-confidence picks that jump to the top of the queue.
- It's still a suggestion: pencil styling, with Keep (closes the ticket without a reply) and "Triage anyway", which asks Claude for a normal suggestion. A person always confirms. Recordings store the "Triage anyway" answer alongside, so the demo works without a live call.
- Queue groups, top to bottom: Needs review, then "Probably no action", then Not triaged yet, then Sent. Closed tickets join Sent as "Closed". This replaces the three-group order.
- Evidence can quote the subject line. EmailBody marks quotes in the subject the same way as in the body. (The earlier all-40 run quoted subject lines twice, and screens dropped them.)
- Every recording carries its prompt version (a hash of the prompt and schema) and model, so a set recorded from different prompts can't pass unnoticed.

**Stakes, the queue top and the full recording** (decided 2026-11-04)
- A runner-up counts toward stakes only if it's within the 15-point margin, the same test as the unsure rule. My reason: a far-behind runner-up isn't doubt. Counting every runner-up made LL-5038 (Bug 70%, Cancellation risk 10%) and LL-5020 (urgency runner-up Urgent at 25%) high stakes and floated them above LL-5040.
- LL-5027 (an urgent request to remove a former employee's admin access) ranking above LL-5040 is correct and stays. The first screen still opens on LL-5040, because `/` redirects to `/tickets/LL-5040`; the queue order doesn't decide what the link opens.
- The recording script rejects placeholders that are instructions to the agent (such as "[Confirm whether a PO field exists…]"), not just advice in the draft's text. LL-5014 was re-run on the same prompt version until it passed.
- All 40 tickets and the vague email are now recorded output, all from one prompt version (`p-48be27bc`, `claude-sonnet-5-5`, 4 November 2026), and merged into the fixtures. Nothing is hand-written any more, including LL-5039, whose recording meets its rule (How-to 96%). Two tickets came back as "Not a request": LL-5002 (an auto-reply) and LL-5003 (a client's reply sent to Ledgerline by mistake).

**Header, theme and pencil** (decided 2026-11-05; shown at `/system`, checked in light and dark at desktop, tablet and phone widths). Reasons marked "to confirm" are Claude's wording of why, not mine yet.
1. No "Recorded example" Banner or label anywhere, and no Banner ever in the header area. This reverses the 2026-11-04 decision to label example output in the interface (First screen, and "Example output has three labeled sources"); `OutputSource` is deleted. Recordings stay real model output, and each keeps `source`, `model` and `promptVersion` in the data. Hand-written output is still not allowed. Reason (to confirm): the label sat above everything at the top of every screen and competed with the unsure ticket for the first look, which is what link 1 depends on.
2. Header: the logo (four petals, `components/ui/logo.tsx`) at 20px, then "TriageDesk" at 16px semibold. The mark is drawn in `currentColor` and colored `--accent`, so it follows light and dark. It's a documented brand exception to the Petrol rule, like the focus ring: it's not a control, sits only in the header, and never appears beside Approve. "TriageDesk", one word, is the product name everywhere, including the browser tab ("LL-5040 · TriageDesk", "Design system · TriageDesk"). Reason (to confirm): a product with a mark and a name reads as a tool, not a demo page. Contrast: the mark is 6.88:1 on the page in light and 9.59:1 in dark. (Changed 2026-11-05: the viewBox is trimmed to the artwork, `110 110 804 804`, and the mark renders at 22px. Reason: the padded file made the mark look about 16px next to 16px semibold text.)
3. A theme toggle on the right of the header: two round icon options, sun and moon, with a neutral selected state (raised like a secondary button), not Petrol. It follows the OS until a person picks one, and remembers the pick in `localStorage`; an inline script in the root layout applies it before the first paint, so there's no flash. /system uses the same toggle in place of its old System / Light / Dark control. Reason: Petrol is kept for decisions, high confidence, the selected queue item and Approve; a theme pick is none of those. (Changed 2026-11-05: a third option, System (monitor icon), comes first and is the default. It follows the OS live; choosing Light or Dark is remembered, and choosing System clears it.)
4. Every button is fully rounded (`--button-radius: 999px`): labelled buttons, icon buttons and toggles (SegmentedControl). Set on the Button tokens, not per screen. Reason (to confirm): pills read as pressable at a glance next to the square-cornered chips, tags and cards, which are records, not controls.
5. Suggested ("pencil") style: no dashed borders. `--suggested-fill` is ink at 7% (`color-mix(in oklch, var(--ink) 7%, transparent)`), and `--suggested-border` is transparent and solid (still 1px, so a value doesn't shift when it's decided). This applies wherever the tokens are used: suggested chips, the suggested draft box, AI tags and the AI timeline dot. Decided stays a Petrol tint with a solid Petrol border. Evidence marks in the email keep their dashed underline; that's evidence, not the suggestion tokens.
   - Trade-off: suggested and decided now differ by color plus words, not by dashed vs solid. So the words must always appear on decided fields: "Set by you" (or a name), "Approved as suggested", and "Claude suggested … · n%". Chip already requires them by type; DESIGN.md rule 1 now says it.
   - Contrast: the gray fill is not a boundary: 1.14:1 against the card in light, 1.18:1 in dark. Text on it passes (ink 12.42:1 / Lc 92 light, 14.06:1 / Lc 98 dark; the AI tag's ink-2 6.54:1 / Lc 77 light, 9.74:1 / Lc 74 dark). The suggested draft box has no 3:1 edge any more; its label ("Draft reply · Suggested") and its text identify it. The AI timeline dot is faint for the same reason; the row names the actor ("Model", "Team rule").
6. Queue items: the tag under each item is left out when it repeats the group heading (no "Needs review" under Needs review, no "Not a request" under Probably no action, no "Not triaged" under Not triaged yet, no "Sent" under Sent). "Sent by rule" and "Closed" stay, as does a tag whose state no longer matches the row's group while it holds its place. Reason (to confirm): a tag that repeats its heading adds nothing and doubles the noise in a 40-row list.
7. (Hint removed later on 2026-11-05: the meter shows no hint text, and "confirm before approving" is only in its accessible value; see DESIGN.md.) ConfidenceMeter is always one line. The hint is "confirm first", truncating with an ellipsis if there's no room; screen readers still hear the full reason. Low loses its fill and padding, so low and medium differ by their word, the bar's length and the hint (low keeps its amber text). Low text is 7.65:1 / Lc 86 on the card in light and 11.30:1 / Lc 75 in dark; the hint (ink-2) 7.46:1 / Lc 86 and 11.50:1 / Lc 76. Reason (to confirm): a wrapped meter and a filled low state made the triage pane jumpy; one line keeps every field the same shape.
8. Shell: the email column is exactly the reading measure plus the pane's padding (448 + 2 × (4 + 16) = 488px), so there's no dead space to the right of the email, and from 1200px the shell is centered with a max width of 1288px (320 + 16 + 488 + 16 + 400 + 48). From 768px the two columns (email 488px, triage 360px) are centered too, so the email never stretches past its measure.
9. Below 1200px the "Queue" text button is a round inbox IconButton ("Open queue") to the right of the theme toggle. In the queue sheet, "Close" is a round × IconButton ("Close queue"), styled the same way, at the right of the sheet's header where "Close" was. The inbox's visible "Inbox" title gave way to the brand; it stays as a visually hidden `h1`. Contrast: icon 7.46:1 in light, 9.49:1 in dark on the button.
- Found while checking: in a dark-scoped element on a light page (the /system side-by-side panes), the focus ring inherited the light accent (2.52:1 on the dark surface). `[data-theme="dark"]` now re-derives `--focus-ring`. The real pages were never affected: there the theme is set on `<html>`.

**Confidence color follows the blocker** (decided 2026-11-05)
- Rule: on a confidence meter, amber means this field needs a person before Approve; Petrol means it doesn't. The color follows whether the field blocks Approve (under 60%, or within 15 points of its runner-up, until a person keeps or switches it), not the confidence band. Recorded in DESIGN.md rules 4 and 5.
- A field that blocks only because it's a close call reads "Close call" instead of "Medium confidence" (e.g. "70% Close call"), and its accessible text says "close call with <runner-up>, confirm before approving".
- Reason: making medium Petrol earlier the same day left a gap. A medium pick within 15 points of its runner-up still blocked Approve, but its meter was Petrol with no hint, so the only sign was its name in ApproveBar's summary. The meter's color must agree with the blocker it explains.
- Supersedes the same day's "medium uses the same Petrol tokens as high" (the `--confidence-medium*` tokens are gone) and its "amber is only for low".
- Checked against the recordings: no recorded field at 60% or above is a close call. The smallest lead at 60%+ is 25 points (LL-5037's urgency, Urgent 60% vs High 35%), and every close call in the 40 recordings is also under 60%. So today every amber meter in the inbox reads "Low confidence", and "Close call" shows only on `/system` until a recording produces one.

**Decided fields: the line, not the label** (decided 2026-11-05)
- Decided chips no longer show "· Set by you" or "· AI pick". Who set it stays in the chip's accessible name, visually hidden ("set by you", or "kept Claude's pick"). "Approved as suggested" still shows.
- "Change" is a round 28px pencil IconButton (the inbox button's secondary styling, 14px icon, ink-2 to ink on hover), named "Change <field>", with a tooltip of the same words.
- Rule: a field a person kept or switched always shows "Claude suggested <pick> · <n>%" under its chip. With the soft-fill suggested style and no "Set by you" on the chip, that line is what states in words who decided, so it's never hidden. The timeline keeps the full record ("set the category to …", "approved … as suggested").

**"AI", not the model's name, in the interface** (decided 2026-11-05)
- UI copy never names the model; it says "AI". "Claude's note" is now "AI note"; "Claude suggested <pick> · <n>%" is "AI suggested <pick> · <n>%"; "Confidence is Claude's estimate, not a measured probability." is "Confidence is the AI's estimate, not a measured probability."; the empty state is "The AI hasn't triaged this ticket yet."; the timeline row is "asked the AI to triage it anyway"; the meter's accessible name and the decided chip's hidden "kept the AI's pick" changed too. The timeline labels the AI's own rows "AI" instead of "Model", so they match "asked the AI to triage it anyway". Recorded as DESIGN.md rule 8.
- Unchanged on purpose: code, the recording script, model IDs (`claude-sonnet-5-5`) and the docs' technical notes, including this brief's history, which still quotes the old copy where it recorded it.
- My reason: "the interface should describe the role, not the vendor, so it stays accurate if the model changes and reads as a product, not a demo of one provider."

**Suggested chips in dark mode** (decided 2026-11-05)
- Dark mode only: suggested chips (Chip `state="suggested"`, such as the pre-selected Category and Urgency) are recessed with a thin edge: background `--bg` (darker than the pane card) and a 1px `--line` edge, no other border. Own tokens, `--suggested-chip-fill` and `--suggested-chip-edge`, set for system dark and explicit dark; in light they give the usual 7% fill and no edge, so light is unchanged. The suggested draft box and AI tags keep their 7% fill.
- My reason: with the shared 7% fill they were nearly the same tone as the 8% secondary buttons beside them; recessing them mirrors light mode, where the suggestion sits in the surface and the buttons sit on it.
- Replaces, the same day, a first try that raised the dark chip fill to 13% ink: it separated the chip from the buttons by being lighter, where this separates it by sitting below them, as in light.
- A deliberate dark-mode exception to the single pencil fill, recorded in DESIGN.md rule 1 and the Chip section.

**Large-desktop layout: tried and reverted** (2026-11-05)
- We tried a wider layout from 1536px (Queue 360px, Email 704px, Triage 360px, a 664px reading measure; then 15px text with a 600px measure and a 640px email column) and reverted it (git revert of both commits). Every desktop width is back to Queue 320px, Email 488px, Triage 400px, the 448px measure and the 1288px max width.
- My reason: a wide email column made lines too long (about 104 characters at 664px and 14px), and the fixes traded away the width we wanted.

**Desktop layout: equal side columns** (decided 2026-11-05)
- Every desktop width (1200px and up): Queue 320px (unchanged), Email 568px, Triage 320px, so queue and triage are equal; the shell max width stays 1288px. The email body is 15px with 1.65 line height and a 528px measure (about 78 characters a line), so the email column is still exactly measure + pane padding (528 + 40). Only the email body is 15px; the draft and evidence quotes stay 14px. Below 1200px nothing changes.
- FieldReview's "Switch to <runner-up>" is now "Use <runner-up>", so Keep / Use / Other fit on one line in the 320px triage pane. If a label is ever too long, the row wraps with Other moving to the next line, never clipped.
- The 1536px large-desktop layout is removed again (a revert of its re-apply), so every desktop width uses these columns.
- My reason: equal side columns, and the email gets the space.
- Checked: all 40 tickets at 1300px have a 320px triage pane with no wrapping or overflow in the Keep / Use / Other rows, one-line meters, no sideways scroll, and a footer of Approve plus a one-line summary under it (or a single row when nothing blocks). The tightest row is "Keep | Use Cancellation risk | Other", with 0.45px to spare in Geist; a different font rendering could wrap Other to the next line, which is the intended fallback. Email lines run 73–81 characters at 1300 and 1728px. At exactly 1200px the email column shrinks to 480px (the window is narrower than the 1288px shell), as columns did there before.

**Large desktop, from 1536px** (decided 2026-11-05)
- From 1536px only: Queue 320px, Email 648px, Triage 320px; the shell max width is 1368px, centered. The email's measure becomes 608px with the same 15px / 1.65 text, so the column is still exactly measure + pane padding (608 + 40). Below 1536px nothing changes.
- Lines run about 89 characters, accepted because support emails are short.
- Checked: at 1536, 1728 and 1920px the columns are 320 / 648 / 320 in a centered 1368px shell, and the email text fills exactly 608px; on LL-5040 full lines run 83–94 characters (86 on average). At 1300 and 1535px nothing changed (320 / 568 / 320, 528px, 1288px). The triage pane is 320px as below 1536px, where all 40 tickets were checked.
- My reason: big screens get a wider email column.

**Approve on small screens, and "AI" in the draft note** (decided 2026-11-05)
- Below 1200px (phones and tablets) the triage footer, with Approve and the blocker summary, is no longer sticky: it sits at the end of the pane, after the draft and the activity, and the person scrolls to reach it. Desktop (1200px and up) keeps it pinned. This changes the rule that Approve is always visible: it's pinned on desktop and at the end of the pane on smaller screens, never hidden.
- My reason: on small screens the pinned bar took up too much of the view while reading.
- The draft note says "Drafted by AI" (and "Drafted by AI, edited by you", and so on), not "Drafted by the model", following DESIGN.md rule 8. The unshown field blocker messages say "The AI is …% sure" and "or use <runner-up>", and /system's copy follows.

**Draft text on phones** (decided 2026-11-05)
- On phones (below 768px) the draft reply is 14px with 1.6 line height, down from 16px, the same as the email body, so the draft matches the email it answers. Tablets and desktops were already 14px.
- Trade-off, accepted: on iPhone, Safari zooms in when a text box under 16px is tapped. The viewport meta tag doesn't set `maximum-scale` or `user-scalable`; zooming stays available.

**Queue sheet on tablets** (decided 2026-11-05)
- On tablets (768–1199px) the queue sheet opens from the right edge and is 380px wide (down from 400px), with rounded corners on its left side. Phones keep the full-width sheet with no corners. Focus handling is unchanged.

**Queue sheet focus and a Petrol inbox button** (decided 2026-11-05)
- Below 1200px, opening the queue sheet moves focus to the sheet itself (`tabIndex={-1}`, no outline on the container), not to its close button, so no focus ring shows after a tap. Tab reaches the close button with its normal focus-visible ring. Closing returns focus to the inbox button: no ring after a tap or click, the usual ring after Escape or keyboard use. Focus-visible styles are never removed from controls.
- The inbox icon button ("Open queue") uses the primary Petrol style: the Petrol gradient, an `accent-ink` icon and the primary hover. A documented exception to the Petrol rule (DESIGN.md rule 4): it's the queue's entry point on small screens, and since Approve is unpinned below 1200px the two rarely compete.

**Activity timeline line** (decided 2026-11-05)
- One continuous connector from the centre of each row's dot to the centre of the next (10px into the row to 10px past its bottom), 1px, centred on the dots, `--ink` at 28%; none after the last row. Dots sit above the line and are opaque.
- The AI dot is a hollow ring: a surface fill with a 1.5px `ink-3` ring inside its edge. Person dots stay solid Petrol. (Before, the AI dot used the 7% pencil fill, which the line showed through.)

**Motion, and a bottom sheet on phones** (decided 2026-11-05)
- A small set of animations, each explaining a change the person caused; frequent actions get little motion, nothing animates on page load, and everything turns off under reduced motion. All numbers and reasons are in DESIGN.md, Motion.
  - A field turning decided: the chip's colors only, 120ms, ease-out-quart. It happens about 100 times a day, often from the keyboard, so nothing moves.
  - Approve becoming the sent line: the line fades in over 150ms (the draft's color changes on the same timing), only when the send happens on screen.
  - The Other menu: its existing 150ms entrance and the caret's turn now share the same ease-out-quart timing.
  - The queue sheet: on tablets it slides in from the right (260ms in, 200ms out); the backdrop fades with it.
- Phones (below 768px): the queue sheet is a bottom sheet instead of a side sheet. It slides up from the bottom edge (300ms in, 220ms out, ease-drawer), is 90dvh tall so the page stays visible above it, has rounded top corners and a grab handle, and can be swiped down on the handle or header: it follows the finger, closes past 160px (or a quarter of its height) or a 0.5px/ms flick, and otherwise springs back. The backdrop, the ×, and Escape also close it; focus handling is unchanged. With reduced motion it simply appears and disappears, and dragging still works.
- Switching theme no longer animates every color on the page.

**No date jump on load** (2026-11-05)
- Dates in the queue and the email's "Received" line no longer jump right after the page loads. They used to be drawn first in a UTC placeholder ("2 Nov, 10:02") and then swapped for local time ("Nov 2, 05:02 AM"), growing about 22px and pushing the company names and the "Received" line. Now an inline script writes local time before the first paint (Next's documented pattern), so times are never shown in UTC.

**The queue opens from a floating button** (decided 2026-11-05; replaces the header's "Open queue" button, the tablet side sheet and the phone bottom sheet)
- Below 1200px the queue opens from a floating action button at the bottom right, 16px from the edges: 44px, fully round, Approve's Petrol style, an inbox icon. At the very top of the page it's extended with a "Queue" label; any scroll down collapses it to the icon. It takes the header Open queue button's place as the third documented exception to the Petrol rule, after the focus ring and the Logo. Reason (to confirm): it's the queue's only entry point on small screens, and it never shows from 1200px, where Approve is pinned. The header has no queue button at any width.
- One button only. It stays on top of the open panel and becomes the close (the inbox icon turns into a ×); a scrim tap, Escape and picking a ticket also close it. The panel opens 12px above it: 20px corners, a "Queue" heading and its own scrolling list; as wide as the panes on phones, 380px wide and up to 640px tall on tablets. It grows from its bottom-right corner (340ms) and shrinks back into it (220ms).
- Built as three popovers (scrim, panel, button) rather than a modal dialog, because a modal makes the button inert and forces a duplicate close button, and swapping between the two stutters. It's managed like a dialog: focus moves in and back, the rest of the page is inert and doesn't scroll.
- The drag handle, the swipe-to-dismiss and the panel's own × are gone with the sheet. IconButton loses its primary variant, and AppHeader its `actions`, since nothing uses them.
- The label's sweep in uses a gentler ease-out than its sweep out. Measured on the button: with the strong ease-out both ways, the word swept in faster than the edge made room and the last letter was clipped at up to 73% opacity; with a gentle ease-out in, nothing is clipped either way.

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
- Recorded examples (real model output; no longer labeled in the interface since 2026-11-05).
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

# TriageDesk design system

Read this and `docs/brief.md` before building any UI. The brief says why; this file says what to use. Tokens are in `styles/`, components in `components/ui`, and `/system` shows every token and component in both themes.

The product's one idea: the interface makes it obvious when the model shouldn't be trusted. Every rule below protects that idea.

## Project rules

These hold on every screen. If a design seems to need an exception, ask; don't make one.

1. **Anything Claude produced renders as a suggestion until a person acts on it.** Suggestions are pencil: a soft gray fill (`--suggested-fill`, ink at 7%) with no visible border. One deliberate dark-mode exception: suggested chips are recessed, with `--suggested-chip-fill` (`--bg`, darker than the pane card) and a 1px `--suggested-chip-edge` (`--line`) and no other border; in light both tokens give the usual 7% fill and no edge. Why: with the shared 7% fill they were nearly the same tone as the 8% secondary buttons beside them; recessing them mirrors light mode, where the suggestion sits in the surface and the buttons sit on it. The suggested draft box and AI tags keep the 7% fill (the AI timeline dot is a hollow ring; see TimelineRow). Use `Chip state="suggested"`, `Tag tone="ai"`, `TimelineRow actor="ai"`, `DraftEditor state="suggested"`. It becomes decided, edited or approved only when a person sets, edits or approves it. A suggestion and a decision differ by color plus words. **A field a person kept or switched always shows the "AI suggested <pick> · <n>%" line under its chip, and it's never hidden:** with the soft-fill suggested style and no visible "Set by you" on the chip, that line is what states in words that a person decided (and what Claude had suggested). A field approved untouched says "Approved as suggested" on its chip instead. The timeline keeps the full record in words: "You · set the category to Bug", "kept the category as How-to", "approved the urgency as suggested: Normal" (TimelineRow, rule 7). Why: if model output looks like a decision, nobody can tell what was checked; and with no border on a suggestion, the words are the cue that doesn't depend on color.
2. **A confidence value always shows as `ConfidenceMeter`: a bar, a percentage and a level word.** Confidence is Claude's own estimate, not a measured probability: never word it as a measurement ("92% accurate", "92% chance"), and say "the AI's estimate" wherever the interface explains it. **Never as a chip or a tag**, and never as a bare number. The one exception is history: once a field is kept or switched, FieldReview replaces its meter with a quiet note, "AI suggested Cancellation risk · 50%". Why: a meter that doesn't block Approve shares Petrol with decisions, so shape and words are what keep them apart; and confidence belongs to suggestions, so a meter beside a value must never show confidence in a different value.
3. **A decided chip always says how it was decided: who set it, or "Approved as suggested".** `Chip state="decided"` requires either `decidedBy` (`"you"` or the person's name) or `asSuggested`. "Approved as suggested" is shown on the chip. Who set it is in the chip's accessible name only ("Bug, set by you", or "How-to, kept the AI's pick" when the person kept the model's value), visually hidden; the visible words are the "AI suggested … · n%" line under it (rule 1), so a decided chip set by a person only appears with that line beside it: inside FieldReview. NoActionReview's closed chip is the one other use; there the footer says it ("Closed by you · <time>"). Why: same as rule 2. A solid petrol chip with no name could be the model; the chip itself stays short, and the line beside it carries the words.
4. **Petrol is only for decisions, a confidence meter whose field doesn't block Approve, the selected queue item and Approve.** Decisions means anything a person set: `Chip state="decided"`, `Tag tone="human"`, `TimelineRow actor="human"`. The focus ring (`--focus-ring`, the accent) is the one documented exception: keyboard focus must always be clearly visible, and it only appears while tabbing, so it never competes with Approve. The `Logo` is the other documented exception, a brand one: the mark is drawn in `currentColor` and colored `--accent`, so it follows light and dark; it's not a control, sits only in the header, and never appears beside Approve. The queue's floating action button below 1200px (`FabPanel`) is the third: Approve's primary style (Petrol gradient, `--accent-ink` icon and label, the primary hover), because it's the queue's entry point on small screens, where the queue isn't on screen. Below 1200px Approve isn't pinned (it sits at the end of the triage pane), so the two are rarely in view together, and the FAB never shows from 1200px, where Approve is pinned. No other control gets the primary style, and no IconButton is ever Petrol. Nothing else uses an `--accent*`, `--decided-*` or `--confidence-high*` token: no petrol links, info banners, headings or icons. A reply a team rule sent has no decision styling, since no person acted: no ink chips, no "Set by you" (FieldReview `readOnly`, DraftEditor `state="sent-by-rule"`, ApproveBar `sentBy="rule"`). Its meters are Petrol, because a sent reply has nothing left to block: the meter describes the model's confidence, not a decision. There are no per-ticket-type exceptions to this rule. **On a confidence meter, amber means this field needs a person before Approve; Petrol means it doesn't.** The color follows whether the field blocks (rule 5), never the confidence band: a 70% pick within 15 points of its runner-up is amber and reads "Close call"; a 70% pick well ahead is Petrol. Why: Petrol means "a person did this" or "fine to go ahead", and amber means "a person is needed here before Approve". A third meaning breaks them, and a meter whose color disagreed with the blocker (a Petrol field that blocks Approve) would hide the reason from where it's fixed.
5. **Approve stays disabled while any blocker is open, and the blockers are listed next to it.** Exactly three things block, and nothing else:
   - an unsure field that no one has kept or switched: under 60%, or within 15 points of its runner-up;
   - any unfilled `[placeholder]` in the draft;
   - an empty draft.

   Get them from `approveBlockers()` in `@/lib/approve`; never write your own checks. It returns one `{ target, message }` per blocker: `target` is the field's name or `"draft"`, and `message` is a sentence with the number that tripped it.

   Approve lives in the triage pane's footer, as `ApproveBar` in Pane's `footer`. On desktop (1200px and up) the footer is pinned at the bottom of the card, so Approve is always in view. Below 1200px (tablets and phones) it isn't sticky: it sits at the end of the triage pane, after the draft and the activity, and the person scrolls to it. Why: on small screens the pinned bar took up too much of the view while reading. ApproveBar shows the button and a one-line summary ("3 things to resolve: Category, Urgency, Draft") whose items jump to where each is fixed. There is no separate blocker list: each reason sits where it's fixed. An unsure field shows it in its meter, which is amber exactly while the field blocks (rule 4): under 60% it reads "Low confidence"; a close call reads "Close call", and screen readers hear "close call with <runner-up>, confirm before approving". Once a person keeps or switches it, the meter gives way to the "AI suggested … · n%" note; the draft gets the blocker's `message` as DraftEditor's `blocker`, and its unfilled placeholders are highlighted in the text. Never hide Approve until the reply is sent (on small screens it's reached by scrolling, never removed); never leave it enabled while a blocker is open; never pin it with negative margins or `position: sticky` of your own.

   The exceptions: a ticket with no model output has no Approve (its triage pane says plainly "The AI hasn't triaged this ticket yet.", and has no footer), and neither does a "Not a request" suggestion, which has no reply to approve: Keep closes it, and the footer then reads "Closed by you · <time>" (ApproveBar `outcome="closed"`).

   After sending, ApproveBar swaps the button for "Sent by you · <time>" and a secondary button: "Next ticket" in the inbox (`afterSend="next-ticket"`), "Back to inbox" for a ticket opened on its own (`afterSend="back-to-inbox"`). The draft becomes `state="approved"` (read-only), and the timeline gets a row: "approved and sent the reply". A draft written for a value a person has since overridden is a warning, not a blocker: pass it as DraftEditor's `warning`. Why: block only where a wrong send is costly; Approve must always be reachable without layout hacks (pinned on desktop, at the end of the pane on smaller screens); and the reason should sit where you fix it, not in a list you read in one place and act on in another.
6. **Model output is real, and its source lives in the data, not the interface.** Every suggestion is recorded or live, never hand-written, and carries `source` (plus `model` and `promptVersion` when recorded). The interface doesn't label it: there is no "Recorded example" banner or label anywhere, and no Banner ever appears in the header area. All 40 tickets and the vague email are recorded (`fixtures/recorded-suggestions.json`, `claude-sonnet-5-5`, 4 November 2026, prompt version `p-48be27bc`). Why: decided 5 November 2026, reversing the earlier label; the reasons are in the brief ("Header, theme and pencil"). The recordings are real model output, and the data keeps the provenance.
7. **Approving never turns an untouched field into "Set by you".** On Approve, each field a person kept or switched shows `decidedBy="you"`; each field nobody touched shows `asSuggested`, labeled "Approved as suggested". `FieldReview` does this when you pass `approved`. The timeline gives them separate rows (see TimelineRow). Why: the record must never claim a person chose something they didn't look at.

8. **UI copy says "AI", never a model name.** Nothing a person sees or hears names the model: visible text, accessible names, tooltips, timeline rows (the AI's own rows are labeled "AI") and empty states all say "AI" ("AI note", "AI suggested Cancellation risk · 50%", "Confidence is the AI's estimate, not a measured probability.", "The AI hasn't triaged this ticket yet.", "asked the AI to triage it anyway"). The model's name and ID stay in the data (`model`, `promptVersion`), the recording script and these docs' technical notes, where prose like "facts Claude can't know" describes how the output is made, not interface copy. Why: the interface should describe the role, not the vendor, so it stays accurate if the model changes and reads as a product, not a demo of one provider.

```tsx
// Correct: rule 5
const blockers = approveBlockers({ fields, draft });

<Pane
  title="Triage"
  footer={
    <ApproveBar
      blockers={blockers}
      targets={{ category: "field-category", urgency: "field-urgency", draft: "draft-reply" }}
      onApprove={approve}
      sentAt={sentAt}
      afterSend="next-ticket"
      onAfterSend={openNextTicket}
    />
  }
>
  <FieldReview id="field-category" … />
  <FieldReview id="field-urgency" … />
  <DraftEditor id="draft-reply" blocker={blockers.find((b) => b.target === "draft")?.message} … />
</Pane>

// Incorrect: the reasons gathered in a list away from where they're fixed, and a home-made blocker
<Banner tone="warning" title="Approve is blocked">{blockers.map((b) => <p>{b.message}</p>)}</Banner>
<Button variant="primary" disabled={draftIsStale}>Approve and send</Button>
```

## Data

Model output has one shape, `Suggestion`, in `@/lib/suggestion`: either a `TriageSuggestion` (`kind: "triage"`: category, urgency, evidence, draft) or a `NotARequestSuggestion` (`kind: "not-a-request"`: a reason, one sentence of explanation and evidence, and no urgency or draft; `triageAnyway` holds the normal suggestion "Triage anyway" shows). Check `kind` before reading fields. Every suggestion has `suggestedAt`, and recorded ones also carry `model` and `promptVersion` (a hash of the prompt and schema, so recordings from different prompts can't be mixed unnoticed). Alongside it alongside `SuggestedField`, `Evidence`, `OutputSourceKind`, `EvidenceSupports` and the value lists `categories` and `urgencies`. Never define your own. Example output lives in `@/fixtures/suggestions` (`suggestionFor(ticketId)`), never in `fixtures/tickets.ts`, which holds inputs only. Show the email with `EmailBody`, passing `suggestion.evidence`; for the evidence list, `matchEvidence(body, evidence)` from `@/lib/evidence` gives the quotes that match word for word. Never search or split the email yourself.

**Times** are ISO 8601 strings everywhere in data and props, and always render through `Time` (TimelineRow, QueueItem and ApproveBar already use it). It shows the viewer's time zone: the time alone if it's today, the date and time if older, the full timestamp with its zone on hover. Never format a time yourself, and never show UTC, not even before the page hydrates. To check Approve, build each field with `approveField(name, suggestion.category, chosen)` and pass the fields to `approveBlockers` (both from `@/lib/approve`).

The draft is only ever words to the customer, and it's grounded in the help center (`@/fixtures/help-center`), not guessed: it may state only facts from the email or those articles, and each article it relies on is recorded as evidence (`ArticleEvidence`: `supports: "draft"`, the article's title and the sentence quoted). Evidence comes in two kinds: `EmailEvidence` backs the category or urgency and is marked in the email; `ArticleEvidence` backs the draft. `matchEvidence()` returns email evidence only. `[Placeholders]` are only for facts Claude can't know: dates, amounts, names, account details. A placeholder that's an instruction to the agent ("[Confirm whether a PO field exists]") is rejected by the recording script. A placeholder never sits inside a question to the customer; questions are asked in plain words. Advice or instructions for the support agent never go in the draft, not even in brackets; they go in `agentNote`, shown above the draft as "AI note". Why: a placeholder blocks Approve until a person fills it, and an instruction left in a draft would be sent to the customer.

```tsx
// Correct
import type { Suggestion } from "@/lib/suggestion";
import { suggestionFor } from "@/fixtures/suggestions";

// Incorrect: a screen-local copy of the shape drifts from everyone else's
type MySuggestion = { category: string; confidence: number; recorded: boolean };
```

## Tokens

Components and screens use role tokens: `styles/theme.css`, `styles/trust.css` and `styles/elevation.css`. Never use the primitives in `styles/tokens.css` (`--petrol-700`, `--gray-100`), and never a raw color (`#fff`, `rgb()`, `oklch()`, `white`). Why: roles switch between light and dark, and every role pair is contrast-checked. A primitive or raw value is checked in neither theme.

**Background**

```
Is it the window behind everything?          → --page
Is it the gray band holding a pane's header? → --tray
Is it a card or pane?                        → --surface
Is it a popover, menu or dialog?             → --surface-raised (+ --shadow-popover / --shadow-dialog)
Is it an inset area inside a card?           → --surface-2
Is it sunk or disabled?                      → --bg
Is it a soft status fill?                    → --warning-soft, --critical-soft, --success-soft
                                                (--accent-soft only under rule 4)
```

**Text**

```
Primary text                         → --ink
Secondary text, or any text on a *-soft fill → --ink-2
Metadata on page, tray, bg, surface or surface-2 only → --ink-3
Status words                         → --warning, --critical, --success
```

Never put `--ink-3` on a `*-soft` fill: it measures 4.08–4.21:1 in light and Lc 59 in dark there, below the 4.5:1 and Lc 60 floor. Use `--ink-2`.

**Borders:** `--line` for dividers and hairline rings (decorative, no contrast needed), `--line-strong` for control borders (3:1). Hairlines use `var(--hairline)`, which is 0.5px on 2× screens.

**Elevation:** three levels and no more: `--shadow-pane`, `--shadow-popover`, `--shadow-dialog`. Suggestions and decisions are flat at every level. Raised means pressable.

**Trust tokens** (`styles/trust.css`) name meanings: `--suggested-*`, `--decided-*`, `--evidence-*`, `--confidence-*`, `--severity-*`. Every meaning has a component (Chip, FieldReview, EmailBody, EvidenceMark, EvidenceItem, ConfidenceMeter, Severity, DraftEditor, ApproveBar); use the component, not the tokens. A new meaning gets a new component in `components/ui`, never inline styles on a screen.

**Type:** the email body has its own size tokens, `--text-email-size` and `--text-email-leading`: the same as reading text (14px / 1.6) below 1200px, and 15px / 1.65 from 1200px. That 15px is the one size outside the scale below, and only EmailBody uses it; the draft and evidence quotes stay 14px. The reading measure, `--text-reading-measure`, is 32em (448px) below 1200px, 528px from 1200px and 608px from 1536px; the email column is always derived from it, so never set an email width yourself. Use the role classes from `styles/type.css`: `text-title` (20), `text-heading` (16), `text-subheading` (14), `text-body` / `text-body-strong` (14), `text-reading` (the email), `text-small` (13), `text-overline` (12, uppercase labels), `text-mono` / `text-mono-small` (IDs, times, figures). Never set a one-off font size, and never go below 12px.

**Themes:** the header's `ThemeToggle` offers System, Light and Dark. System is the default and follows the OS live, including when the OS setting changes while the page is open. Choosing Light or Dark overrides it and is remembered in `localStorage` (`lib/theme.ts`) and set as `<html data-theme>`, by an inline script in the root layout before the first paint; choosing System clears the stored choice. Read the theme on screen with `useTheme()` from `@/components/ui`; never write `data-theme` on `<html>` yourself. `data-theme="light"` or `"dark"` also works on any element, to show one theme inside the other. Set `background` and `color` on that element yourself.

**Visually hidden text:** `visually-hidden` (in `app/globals.css`) names something for screen readers without showing it, such as the inbox's `h1`, whose header row shows the product name instead.

## Layout

Screens are built from `Pane`s in a shell grid. Never hand-build a tray, a card or their corners.

**Shell** (the screen's `<main>`; the page background is already `--page`). Padding 16px below 768px, 24px from 768px. Gap between panes: 16px. The header row is `AppHeader` and spans every column: the logo and "TriageDesk" on the left, the theme toggle on the right. Nothing else goes in it, and never a Banner. Nothing ever scrolls sideways.

**The email column** is exactly the email's reading measure plus the pane's padding (2 × (4px tray + 16px card) = 40px), so there's no dead space to the right of the email. Below 1200px: a 448px measure (32em at 14px) and a 488px column. From 1200px, every desktop width: the email body is 15px with 1.65 line height and a 528px measure, about 78 characters a line (73–81 measured on LL-5040), so the column is 568px; the queue and triage are both 320px, and the shell is centered with a max width of 1288px (320 + 16 + 568 + 16 + 320 + 2 × 24). Why: equal side columns, and the email gets the space. **Large desktop, from 1536px:** the same 15px / 1.65 text on a 608px measure, so the email column is 648px; the queue and triage stay 320px, and the shell is centered with a max width of 1368px (320 + 16 + 648 + 16 + 320 + 48). Lines run about 89 characters (83–94 measured on LL-5040), accepted because support emails are short. Why: big screens get a wider email column. From 768px the columns are centered.

With a queue (the inbox, where a person works through tickets). The inbox is `/tickets/[id]`, so every open ticket has its own URL; `/` redirects to the first-screen ticket. Read the ID with `useParams()` in a client component, never by awaiting `params` in the page: with Cache Components on, server-side `params` blocks instant navigation between tickets. Its header row is `AppHeader`, the same at every width (no queue button in it). Below 1200px the queue opens from a floating action button at the bottom right (`FabPanel`), and the shell's bottom padding is 76px (16px from the bottom + the 44px button + 16px, plus the safe-area inset), so the page ends above the button and it never covers the last of the content. The screen's `h1` ("Inbox") is `visually-hidden`.

| Width | Columns |
| --- | --- |
| 1536px and up | `320px minmax(0, 648px) 320px`: queue, email, triage, centered, max 1368px; the email body is 15px / 1.65 with a 608px measure. Otherwise as 1200px. |
| 1200–1535px | `320px minmax(0, 568px) 320px`: queue, email, triage, centered, max 1288px; the email body is 15px / 1.65 with a 528px measure. The shell is `100dvh` tall and each pane's card scrolls on its own. |
| 768–1199px | `minmax(0, 488px) 360px`: email, triage, centered. The queue moves behind the floating "Queue" button (`FabPanel`), which opens it in a panel above the button, 380px wide and up to 640px tall, with the open ticket highlighted and scrolled to the middle; picking a ticket, the button (now a ×), a scrim tap or Escape closes it. |
| Below 768px | One column: email, then triage. The same button and panel; the panel is as wide as the panes (16px side margins) and runs from just below the header to just above the button. |

**Queue order** comes from `orderQueue()` in `@/lib/queue`; never sort it yourself. Four groups, top to bottom, each headed in `text-overline`:

A QueueItem's Tag never repeats its group's heading: no "Needs review" under Needs review, no "Not a request" under Probably no action, no "Not triaged" under Not triaged yet, no "Sent" under Sent. "Sent by rule" and "Closed" always stay, and so does a tag whose state no longer matches the group (a ticket sent while it holds its place in Needs review shows "Sent"). `queue-list.tsx` does this; a new list follows the same rule.

1. **Needs review**: triaged and not yet sent. High stakes before normal, then the least sure first. High stakes means the category is Billing or Cancellation risk, or the urgency is Urgent, counting the runner-up as well as the top pick only when it's within the 15-point margin (the same test as "unsure"); once a person decides a field, only their value counts. Why: when Claude is unsure between two values, assume the higher stakes, so a likely cancellation can't sink just because the top guess was How-to; but a far-behind runner-up (Cancellation risk at 10% behind Bug at 70%) isn't doubt, and counting it floated ordinary tickets to the top.
2. **Probably no action**: Claude suggests the email isn't a request, and nobody has closed it or triaged it anyway; newest first. After "Triage anyway" the ticket moves to Needs review at the next re-sort.
3. **Not triaged yet**: no model output, newest first.
4. **Sent**: sent by a person or a rule, or closed without a reply, most recent first. Rule sends keep "Sent by rule" and closed tickets keep "Closed".

The order is computed when a ticket opens and held while it's open: the queue re-sorts only when a different ticket opens, or on reload. Tags still update live. Why: a row must never move out from under the person working on it.

The browser tab reads "<ticket ID> · TriageDesk" (and /system "Design system · TriageDesk"; the product name is always one word, "TriageDesk"), set on the client because the page can't read the ID on the server: the ticket panes render a React `<title>`, and no layout or page above them sets a metadata title (Next would overwrite it on navigation).

**Triage pane for "Not a request":** NoActionReview, then the AI note if there is one, then the Timeline; no footer until it's closed. **Triage pane, top to bottom:** Category, then Urgency (each a FieldReview with its own evidence beneath it; hovering or focusing a quote marks it in the email), then the AI note if there is one (`Banner` info titled "AI note", from `suggestion.agentNote`), then the draft, then the activity `Timeline` (collapsed, "Activity · 3"). Approve is in the footer. The first field still showing a meter gets `explainEstimate`, so the pane says once, under that meter, "Confidence is the AI's estimate, not a measured probability."

Without a queue (a single ticket opened on its own, from a link): the same shell minus the queue column, and no queue button. That's not an exception, so don't ask about it. After sending, ApproveBar offers "Back to inbox" instead of "Next ticket".

| Width | Columns |
| --- | --- |
| 1200px and up | `minmax(0, 568px) 320px`: email, triage, centered, `100dvh` tall, each card scrolling on its own. |
| 768–1199px | `minmax(0, 488px) 360px`: email, triage, centered. |
| Below 768px | One column: email, then triage. |

**Pane** is the only pane: a `--tray` band (14px corners, 4px padding, `--shadow-pane`) holding a header (`text-heading` title, optional meta; 16px inline padding) and a `--surface` card (10px corners, 16px padding). Corners are concentric: inner radius = outer radius − the padding between them.

**Titles line up with content.** Every pane title starts at exactly the same left edge as that pane's content: 4px tray padding + 16px = 20px from the tray's edge, for the header and the card alike. A list whose rows have their own padding (the queue) uses `Pane inset="list"`: the card's content is inset 4px, and each row and group heading has 12px inline padding, so 4 + 12 = 16px matches the title and a row's hover or selected fill has 4px on each side. The queue's FabPanel does the same: title at 16px, list inset 4px, rows 12px. Why: a title that starts 4px left of what it names reads as misaligned, and the fix moves the titles (+4px), not the content. Never line things up with negative margins.

**Other corners:** popovers and menus 10px, dialogs 14px, the FAB's panel 20px (it floats free of the panes, so it's rounder). Every button is fully rounded (`--button-radius: 999px` in `styles/elevation.css`): Button, IconButton and SegmentedControl all use it, so change the token, never a screen. Components own their corners (4–8px for everything else); never override them.

## Motion

Animate only where motion explains a change the person caused. This is a tool used all day, so frequent actions get little or no motion, and nothing animates on page load (an element that's already in its state when the page appears doesn't play an entrance). Only `transform`, `opacity`, colors and clip paths animate; never width, height, margins or layout. The one exception is the queue FAB extending and collapsing (width, padding and gap), on a single small fixed button, where nothing else on the page moves. Open/close states use CSS transitions, so reversing mid-way is smooth; keyframes only for one-way entrances. Tokens are in `styles/motion.css`: `--ease-out-quart` `cubic-bezier(0.165, 0.84, 0.44, 1)` for small enters and color changes, the `--*-fab-*` and `--*-panel-*` tokens for the queue FAB and its panel. Never write a duration or easing by hand; add a token. Everything is under 200ms except the FAB and its panel.

| What | Animates | Duration, easing | What it explains | Reduced motion |
| --- | --- | --- | --- | --- |
| A field turning decided (Keep, Use, a menu pick, Approve) and back on Change | The chip's fill, edge and text color, nothing moves. The meter-to-line swap, the buttons going and the text below moving up are instant. | 120ms (`--duration-decide`), `--ease-out-quart` | The value you acted on went from pencil to ink, in place. Color only and short, because it happens about 100 times a day and often from the keyboard. | Instant |
| Approve becoming "Sent by you · <time>" (or "Closed by you") | The new line and "Next ticket" fade in (opacity); Approve goes at once. The draft's fill and edge turn approved over the same time. | 150ms (`--duration-sent`), `--ease-out-quart` | The send happened, and the button's place now holds its record. Only when the send happens on screen: a ticket that loads already sent (a rule's, or one sent earlier) shows the line with no fade. | Instant |
| The Other menu opening, and its caret turning | Scale 0.97 to 1 with a fade, from the trigger's corner; the caret turns 180° on the same timing. Closing is instant (the choice usually replaces the trigger). | 150ms (`--duration-menu`), `--ease-out-quart` | The options came from this button. | No entrance, no turn |
| The queue FAB collapsing (any scroll down; opening the panel) | The "Queue" label fades out with a right-to-left gradient sweep (the mask's stop position, `--fab-reveal`); 60ms later the width, padding and gap shrink, anchored at the right edge. The fade always runs ahead of the shrinking edge, so no letter is cut off. | Sweep 220ms (`--duration-fab-label`), `--ease-fab-label-out` (ease-out-quart), at once; shrink 240ms (`--duration-fab-resize`), `--ease-fab` `cubic-bezier(0.2, 0, 0, 1)`, after 60ms (`--delay-fab-collapse`) | You've left the top, so the button gets out of the content's way; opening, it's becoming the close control. | Collapses instantly |
| The queue FAB extending (back at the very top, panel closed) | The reverse: the width, padding and gap grow first, then the label sweeps back in, left to right. | Grow 240ms, `--ease-fab`, at once; sweep 220ms, `--ease-fab-label-in` (a gentle ease-out, so the word appears no faster than the edge makes room for it), after 90ms (`--delay-fab-label-in`) | You're back at the top, where there's room to name it. | Extends instantly |
| The FAB's icon on open and close | The inbox icon turns and fades out as a × turns and fades in (and back on close), while the button collapses, so the icon slides right as it morphs. The button itself never moves or turns into the panel. | 260ms (`--duration-fab-icon`), `--ease-fab`, after 40ms (`--delay-fab-icon`) | The same button now closes the queue. | Swaps instantly |
| The FAB pressed | Scales to 0.96. | 150ms (`--duration-press`), ease-out | The press registered. | Scales without a transition |
| The queue panel opening | Grows diagonally from its bottom-right corner, the corner nearest the button (a `clip-path` inset from that corner to the whole panel); its content fades in after about a fifth of the way. The scrim fades in with it. | 340ms (`--duration-panel-in`), `--ease-panel-in` `cubic-bezier(0.05, 0.7, 0.1, 1)`; content 200ms after 68ms; scrim 220ms (`--duration-scrim`) | The queue came out of the button. | Appears |
| The queue panel closing | Shrinks back into the corner, its content fading first; the scrim fades out with it. | 220ms (`--duration-panel-out`), `--ease-panel-out` `cubic-bezier(0.3, 0, 0.8, 0.15)`; content 90ms; scrim 220ms | It went back into the button. | Disappears |

Exits are faster than entrances. The panel and scrim are popovers that transition `display` and `overlay` discretely, so their exit can play before they're hidden; browsers without that (Firefox) close them instantly, which is fine. The FAB doesn't animate before the page's first paint: a page that loads already scrolled shows it collapsed at once. Switching theme never animates colors: ThemeToggle applies the new theme with transitions off for that one style pass (`[data-theme-switching]`). Every animation has a `prefers-reduced-motion: reduce` rule in its component's CSS that turns it off, fades included.

## Components

Import every component and its props type from `@/components/ui`, never from a component's own file (`@/components/ui/chip`). ESLint rejects the file path. Data types such as `EvidenceSupports` come from `@/lib/suggestion`, not from a component. No component accepts `className` or `style`. The variant unions below are the complete set: an unlisted variant is a bug, not an option. Lay components out from the parent's own CSS module, and never restyle them.

### Button

Use for actions. Navigation is a link, not a Button.

- `primary`: Approve, and nothing else (rule 4). One per screen. (The one other primary control is the queue's floating button, FabPanel, below 1200px, rule 4.)
- `danger`: discarding or undoing something a person made. Red text on secondary chrome, so it never outweighs Approve.
- `secondary`: everything else. This is the default.
- `size="small"`: inside a Banner, a table row or a toolbar. Otherwise `default`.

Every Button is fully rounded, from `--button-radius`. An action with an icon and no words is an `IconButton`.

```
Does it approve and send?            → variant="primary"
Does it throw away a person's work?  → variant="danger"
Default                              → variant="secondary"
```

```tsx
// Correct
<Button>Edit draft</Button>

// Incorrect: primary for a non-Approve action puts Petrol where it doesn't belong
<Button variant="primary">Edit draft</Button>
```

### Menu

A button that reveals more options, and the menu it opens. **A button that reveals more options uses a filled caret, never an ellipsis**: the label ("Other") and a 12px filled caret-down (`--ink-2`, 2px gap) that turns 180° while open (160ms ease-out; instant with reduced motion). **Secondary choices go in a Menu, not an inline row that appears, so the layout doesn't shift.** The menu is a popover below the button: `--surface-raised`, `--shadow-popover`, 12px corners, 4px padding, a `text-overline` heading (its name, such as "Category"), then one `menuitem` per option (8px corners, `--button-bg-hover` soft fill on hover and focus). It's aligned to the button's left edge, or its right edge if it would overflow, and flips above if there's no room below. It renders in the top layer, so no pane or scroll container clips it. Entrance: scale 0.97 to 1 with a fade, 150ms ease-out, from the button's corner; none with reduced motion.

Keyboard and screen readers: the trigger has `aria-haspopup="menu"` and `aria-expanded`; focus moves to the first item on open (ArrowDown on the trigger opens it too); Up, Down, Home and End move; Escape closes and returns focus to the trigger; Tab closes it. A click outside, a scroll or a resize closes it. `onSelect` gets the item's value; the menu closes without moving focus, since the choice usually replaces the trigger (FieldReview moves focus to "Change").

```tsx
// Correct
<Menu size="small" label="Other" heading="Category" items={others.map((c) => ({ value: c, label: c }))} onSelect={choose} />

// Incorrect: an ellipsis instead of a caret, and options that push the layout down when they appear
<Button onClick={() => setOpen(true)}>Other…</Button>
{open && <div className={styles.row}>{others.map((c) => <Button key={c}>{c}</Button>)}</div>}
```

### IconButton

A round secondary button holding one icon, with Button's chrome (raised, neutral, `--button-radius`; the icon `--ink-2`, `--ink` on hover). Never Petrol: the queue's floating button is `FabPanel`, not an IconButton. `icon` is one of `inbox`, `close`, `pencil` (the set in `components/ui/icon.tsx`; `monitor`, `sun` and `moon` are ThemeToggle's), and `aria-label` is required. `size`: `default` is 32px with an 18px icon; `small` is 28px with a 14px icon (inline beside a value: FieldReview's "Change <field>"). `tooltip` shows the aria-label in a small inverted tooltip to the button's right, on hover after 400ms and at once on keyboard focus. It sits beside the button, never below, so it can't cover the "AI suggested" line under a decided value; use it only where there's room to the right (not at a viewport edge). For small icon actions such as FieldReview's Change; anything that approves or sends is a labelled Button.

```tsx
// Correct
<IconButton icon="pencil" size="small" tooltip aria-label="Change category" onClick={reopen} />

// Incorrect: an icon with no name; screen readers announce "button"
<IconButton icon="pencil" aria-label="" onClick={reopen} />
```

### AppHeader, Logo and ThemeToggle

`AppHeader` is the header row on every screen: `Logo` (22px) and "TriageDesk" (16px semibold, `text-heading`) on the left; `ThemeToggle` on the right. It takes no props. Never a Banner or anything else there (rule 6).

`Logo` is the brand exception to rule 4: `currentColor`, colored `--accent`. Its viewBox is the artwork's bounds, `110 110 804 804`, not the source file's `0 0 1024 1024`, so the mark fills its box; it renders at 22px. Why: the padded file made the mark look about 16px next to 16px semibold text.

`ThemeToggle` is a SegmentedControl of three round icon options: System (monitor), Light (sun), Dark (moon), each named by its `aria-label`. It's a radiogroup, so arrow keys move and select. The selected option is neutral (never Petrol). System is the default and follows the OS live; Light or Dark overrides it and is remembered; System clears the stored choice. Use it only through AppHeader.

```tsx
// Correct, on every screen
<AppHeader />

// Incorrect: a label in the header area, and a hand-built brand
<header><h1>Triage Desk</h1><Banner title="Recorded example">…</Banner></header>
```

### Tag

A short label inside a row. A field value is a Chip.

- `neutral` (the default): categories and plain facts ("Billing").
- `warning`: needs a person ("Needs review").
- `success`: done ("Sent").
- `ai`: the model or a team rule acted ("Sent by rule"). Pencil: the soft gray fill, no border.
- `human`: a person acted ("Edited"). Petrol, so only under rule 4.

```tsx
// Correct
<Tag tone="ai">Sent by rule</Tag>

// Incorrect: a confidence value as a tag breaks rule 2
<Tag tone="success">92%</Tag>
```

### FieldReview

Reviewing one suggested field: category or urgency. Use it for every field a person reviews; never assemble chips, meters and buttons yourself.

- While suggested: the pencil chip, the ConfidenceMeter, and two small secondary Buttons, "Keep" and "Use <runner-up>" (short, so Keep / Use / Other fit on one line in the 320px desktop triage pane; all 40 tickets do, checked at 1300px, the tightest being "Use Cancellation risk" with under 1px to spare), and a small "Other" `Menu` with the rest of the list, headed with the field's name. The override is one click, and none of these competes with Approve. If a label is ever too long for one line, the row wraps, with Other moving to the next line; buttons are never clipped or truncated.
- Once kept or switched: the solid chip (who set it is in its accessible name, not shown), a round 28px pencil `IconButton` (`size="small"`, `tooltip`), "Change <field>", that reopens the controls, and, in place of the meter, the line "AI suggested Cancellation risk · 50%" (rule 2). That line always shows on a decided field: it's the visible words for who decided (rule 1).
- `approved`: locks the field. An untouched field shows "Approved as suggested" (rule 7).
- `readOnly`: a reply a team rule sent. The chip stays pencil and the meter stays, Petrol, since nothing is left to block (rule 4); no controls, no decision styling.
- `explainEstimate`: shows "Confidence is the AI's estimate, not a measured probability." under the meter. Pass it to the first field that still shows a meter, so it appears once per pane.
- `evidence`: this field's quotes, from `matchEvidence()` filtered by `supports`, listed beneath it. Pass `onEvidenceActive` and keep the quote in screen state for EmailBody's `activeQuote`; the quotes then respond to hover and keyboard focus.

It's controlled: keep `value` (null until someone keeps or switches) on the screen, because the Approve blockers need it. Give it an `id` and pass that in ApproveBar's `targets`, so the summary can jump to it. `options` is `categories` or `urgencies` from `@/lib/suggestion`. Its heading is an h3, so put it in a Pane. After each choice, add a timeline row: "kept the category as How-to" or "set the category to Billing".

```tsx
// Correct
<FieldReview id="field-category" label="Category" field={suggestion.category} options={categories} value={category} onValueChange={setCategory} approved={sent} />

// Incorrect: hand-built review controls; primary-looking buttons compete with Approve
<Chip state="suggested">How-to</Chip>
<Button variant="primary" onClick={keep}>Keep</Button>
```

### NoActionReview

Claude's suggestion that an email isn't a request: an auto-reply, an empty message, one sent to the wrong place, or nothing to do. Use it for every `NotARequestSuggestion`; never force a FieldReview onto one. It's still a suggestion: a pencil "Not a request" chip with the reason and Claude's one-sentence explanation, its evidence, and two small secondary Buttons: "Keep" (closes the ticket without a reply; the chip turns decided, with "set by you" in its accessible name, and the footer reads "Closed by you · <time>") and "Triage anyway" (shows the normal suggestion in `triageAnyway`; leave `onTriageAnyway` out when there is none). A person always confirms. Add timeline rows: "closed the ticket without a reply", or "asked the AI to triage it anyway" followed by the AI's new suggestion.

```tsx
// Correct
<NoActionReview reason={s.reason} explanation={s.explanation} evidence={matched} closed={closed} onKeep={keep} onTriageAnyway={s.triageAnyway ? triageAnyway : undefined} />

// Incorrect: closing a non-request automatically; a person always confirms
useEffect(() => { if (s.kind === "not-a-request") close(); }, [s]);
```

### Chip

A field's value (category, urgency) shown on its own, such as in a list or a header. A field under review is a FieldReview. A short label in a row is a Tag; a choice between views is a SegmentedControl.

- `suggested`: the model's value, not yet acted on (rule 1). It uses `--suggested-chip-fill` and `--suggested-chip-edge`: in light, the 7% ink fill and no edge; in dark, a deliberate exception, recessed on `--bg` with a 1px `--line` edge (drawn on the chip's own 1px border, so its size never changes), so it doesn't match the 8% buttons beside it in FieldReview. Never use those tokens for anything but a suggested chip.
- `decided`: decided by a person. Requires `decidedBy="you"` (or a name) when a person kept or switched it, or `asSuggested` when it was approved untouched (rules 3 and 7). "Approved as suggested" shows; `decidedBy` is only in the accessible name ("set by you"), so put a decided chip only where the "AI suggested … · n%" line is beside it (FieldReview does).
- `default`: an option nobody has picked, such as the runner-up.
- `aiPick`: true on whichever chip holds the model's pick. On a default or suggested chip it adds the words "AI pick". On a decided chip it shows nothing and changes the accessible name to "kept the AI's pick"; the "AI suggested" line already names the pick.

```
Did a person keep or switch it?      → state="decided" decidedBy="you"
Was the ticket approved untouched?   → state="decided" asSuggested
Did the model propose it?            → state="suggested"
Is it an unpicked alternative?       → state="default" (add aiPick if it's the model's pick)
```

```tsx
// Correct
<Chip state="decided" decidedBy="you" aiPick>How-to</Chip>

// Incorrect: model output shown as decided, and no decidedBy (also a type error)
<Chip state="decided">How-to</Chip>
```

### ConfidenceMeter

The only way to show a confidence value (rule 2). The value is Claude's own estimate, not a measured probability; every meter's accessible name says so ("Confidence: the AI's estimate, not a measured probability"), and the triage pane says it once in words (FieldReview `explainEstimate`). There's no hover-only explanation. Pass `value` from 0 to 1, and `runnerUp` (the runner-up's 0–1 confidence) whenever there is one. The level comes from the rounded percentage: high from 85%, medium from 60%, low below. You can't pass a level. Its color follows whether the field blocks Approve, not the band (rules 4 and 5): amber (`--confidence-low*`) while the pick is unsure, meaning under 60% or within 15 points of `runnerUp`, until you pass `confirmed` once a person has kept or switched it; Petrol (`--confidence-high*`) otherwise. The token names keep their history: read `high` as "doesn't block" and `low` as "blocks". The word is the level ("High confidence", "Medium confidence", "Low confidence"), except a pick that blocks only because it's a close call, which reads "Close call" (e.g. "70% Close call"). Pass `runnerUpLabel` (the runner-up's value) with `runnerUp`, so the accessible value says "70%, close call with Cancellation risk, confirm before approving"; under 60% it says "48%, low confidence, confirm before approving". No fill, padding or hint text. Why: the meter's color must agree with the blocker it explains; a Petrol meter on a field that blocks Approve hid the reason. It's always one line, and nothing in it shrinks. Never put it in a horizontally scrolling container. Don't put it inside a QueueItem's `meta`; use a `Tag tone="warning"` there.

```tsx
// Correct
<ConfidenceMeter value={0.71} runnerUp={0.64} runnerUpLabel="Cancellation risk" confirmed={kept} />

// Incorrect: a level can't be passed (type error); it would let the figure and the word disagree
<ConfidenceMeter value={0.64} level="high" />
```

### EmailBody

The customer's email. Pass `subject`, `body` and the model's `evidence` (and the sender block as `meta`); it renders the subject as the heading, splits paragraphs, keeps line breaks, marks each quote in place with EvidenceMark, and drops any quote that doesn't match the email word for word. Evidence may quote the subject line, which is marked the same way as the body. `activeQuote` (from FieldReview's `onEvidenceActive`) turns that quote's dashed underline solid and 2px, and scrolls it into view if it's out of sight (instantly with reduced motion). A quote cited for both fields is marked once, in urgency red (red means it raises the stakes), and the evidence item under either field highlights that same mark.

```tsx
// Correct
<EmailBody body={ticket.body} evidence={suggestion.evidence} />

// Incorrect: a hand-written search-and-wrap loop; every screen would mark quotes differently
{paragraphs.map((p) => <p>{markUp(p, evidence)}</p>)}
```

### EvidenceMark

The mark EmailBody and EvidenceItem use: a fill and a dashed underline. `supports` is `category` (gray) or `urgency` (red). Screens don't use it directly; use EmailBody.

```tsx
// Correct (inside components only)
<EvidenceMark supports="urgency">Our renewal is on 15 December</EvidenceMark>

// Incorrect: a hand-built mark
<mark style={{ background: "var(--evidence-urgency)" }}>renewal is on 15 December</mark>
```

### EvidenceItem

The same quote in the evidence list beside the email, under the word for what it supports. Pass the quote, word for word, as children.

```tsx
// Correct
<EvidenceItem supports="urgency">Our renewal is on 15 December</EvidenceItem>

// Incorrect: a paraphrase; evidence must match the email word for word
<EvidenceItem supports="urgency">Renewal is mid-December</EvidenceItem>
```

### TimelineRow

One entry in the activity timeline. Rows go in a `Timeline`, which is collapsed by default behind "Activity · <count>".

- `actor="ai"`: the AI or a team rule. `name` defaults to "AI" (rule 8: never the model's name); pass "Team rule" for rules. A hollow ring: a `--surface` fill with a 1.5px `--ink-3` ring inside its edge.
- `actor="human"`: a person. `name` is required. Solid petrol dot.

Rows are joined by one continuous 1px connector (`--ink` at 28%) from the centre of each row's dot to the centre of the next row's, whatever the rows' heights (it starts 10px into a row and ends 10px past its bottom), centred on the dots; there's none after the last row. Dots sit above the line and are opaque, so it never shows through them.

On Approve, a field a person kept or switched already has its own row ("set the category to Cancellation risk"). Each untouched field gets a separate row that says so: "approved the urgency as suggested: Normal". Never fold the two together (rule 7).

```tsx
// Correct
<TimelineRow actor="ai" name="Team rule" at="2026-11-02T16:31:00Z">sent the reply without review</TimelineRow>

// Incorrect: an automatic send recorded as a person's act breaks rule 1
<TimelineRow actor="human" name="Team rule" at="2026-11-02T16:31:00Z">sent the reply without review</TimelineRow>
```

### Banner

A message about the whole view, inside a pane. Never in the header area (rule 6). A message about one field goes beside that field as `text-small`.

- `info` (the default): neutral facts, such as "AI note". Gray with a hairline ring, never petrol. Never a label for where model output came from (rule 6).
- `warning`: a person must act before going on, including "Approve is blocked" (rule 5).
- `error`: something failed. It announces itself (`role="alert"`).

`title` says the point in a few words; children add detail; `action` takes one small Button.

```tsx
// Correct
<Banner tone="warning" title="Approve is blocked" action={<Button size="small">Use runner-up</Button>}>
  The top two categories are 0.07 apart, below the 0.15 margin.
</Banner>

// Incorrect: color with no words; the title must say what's wrong
<Banner tone="warning" title="Warning" />
```

### QueueItem

One ticket in the inbox list, with 12px inline padding: put the list in `Pane inset="list"` (or FabPanel), and give group headings the same 12px, so item text and headings start where the pane's title does (see Pane). `current` marks the ticket open beside the queue with a petrol tint (rule 4); only one item is `current`. `meta` takes Tags only, and only one that doesn't repeat its group's heading (see Queue order); leave it out otherwise.

```tsx
// Correct
<QueueItem current sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" receivedAt={ticket.receivedAt} />
<QueueItem sender="Jonah Reyes" subject="How do I add a user?" preview="Hi, quick one…" receivedAt={rule.sentAt} meta={<Tag tone="ai">Sent by rule</Tag>} />

// Incorrect: a confidence value as a tag (rule 2), and a meter here would be a block inside a button.
// (Also incorrect: <Tag tone="warning">Needs review</Tag> under the Needs review heading; it repeats it.)
<QueueItem sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" receivedAt={ticket.receivedAt} meta={<Tag>92%</Tag>} />
```

### DraftEditor

The reply draft. `state` is required; the label shows it in words ("Draft reply · Suggested").

- `suggested`: the model's draft, untouched. Pencil: the soft gray fill, no visible border (rule 1). The first change a person types shows it as `edited` and calls `onStateChange("edited")`. Give each new draft its own `key`, so it starts suggested again.
- `edited`: a person changed it, or wrote it from scratch. Solid control border.
- `approved`: approved or sent by a person. Read-only, in the decided style (rule 4).
- `sent-by-rule`: sent by a team rule without review. Read-only and still pencil; no decision styling.

**Text size:** the draft is 14px with 1.6 line height at every width, the same as the email body below 1200px, so the draft matches the email it answers (from 1200px the email body is 15px / 1.65; the draft stays 14px). On phones this is a deliberate trade-off: on iPhone, Safari zooms in when a text box under 16px is tapped, and we accepted that so the draft matches the email. Never prevent the zoom with `maximum-scale` or `user-scalable` in the viewport meta tag; zooming must stay available. Other text inputs keep `--text-input-size` (16px on phones).

`blocker` takes the draft's blocker message from `approveBlockers()` and shows it under the draft (rule 5). Unfilled `[placeholders]` are always highlighted in the text: a `--warning-soft` fill with a dashed `--warning` underline.

`note` says who drafted it, in every state ("Drafted by AI, edited by you"; never "the model", rule 8). `warning` shows something to check that doesn't block Approve, such as "The draft was written for How-to; the category is now Cancellation risk." Use `defaultValue` when the editor owns the text, or `value` and `onChange` when the screen does.

```
Has a person approved or sent it?     → state="approved"
Has a person typed in it, or written it? → state="edited"
Is it the model's draft, untouched?   → state="suggested"
```

```tsx
// Correct
<DraftEditor key={ticket.id} label="Draft reply" state="suggested" onStateChange={setDraftState} note="Drafted by AI" defaultValue={draft} />

// Incorrect: a model draft shown as a person's edit breaks rule 1, and the note is missing
<DraftEditor label="Draft reply" state="edited" defaultValue={draft} />
```

### Pane

Every pane on a screen (see Layout). `title` names it; `meta` takes a short fact or a Tag, such as the ticket ID. Never put a model suggestion in `meta`, such as an unconfirmed urgency as a Severity; the header reads as settled (rule 1). Children go in the card, which scrolls on its own when the shell gives the pane a height. `footer` sits at the bottom of the card: pinned from 1200px while the content scrolls above it, and below 1200px simply after the content (not sticky); the triage pane puts ApproveBar there, and nothing else goes in a footer.

```tsx
// Correct: meta holds facts, never a model suggestion (rule 1)
<Pane title="Email" meta={<span className="text-mono-small">{ticket.id}</span>}>{children}</Pane>

// Incorrect: a hand-built tray with its own corners
<section className={styles.tray}><div className={styles.card}>{children}</div></section>
```

### ApproveBar

Approve and what follows it; it only goes in the triage Pane's `footer` (rule 5). Before sending: the primary "Approve and send" button, disabled while any blocker is open, and a one-line summary whose items jump to where each is fixed (`targets` maps each blocker target to an element id). After sending (`sentAt` set): "Sent by you · <time>", or "Sent by rule · <time>" with `sentBy="rule"`, or "Closed by you · <time>" with `outcome="closed"` (a kept "Not a request"), and "Next ticket" or "Back to inbox" (`afterSend`).

```tsx
// Correct: a ticket opened on its own, outside the inbox
<ApproveBar blockers={blockers} targets={targets} onApprove={approve} sentAt={sentAt} afterSend="back-to-inbox" onAfterSend={backToInbox} />

// Incorrect: Next ticket where there's no queue to go to
<ApproveBar … afterSend="next-ticket" onAfterSend={() => {}} />
```

### Time

Every time on screen (see Data, Times). Pass `dateTime` as ISO 8601. Times are local from the first paint, so nothing jumps on load: the formatting lives in `lib/time-format.ts` (`formatTime`), the root layout embeds it as a `<head>` script, and each Time renders a tiny inline script right after its `<time>` that writes the local text and title before the browser paints it (Next's documented pattern for dates). `suppressHydrationWarning` keeps that text, and after hydration the client renders the identical string. On client-side navigation the script is inert and the component formats directly. Never format a time in a screen, and never render a time without Time.

```tsx
// Correct
<Time dateTime={ticket.receivedAt} />

// Incorrect: formatted by hand, and in UTC
<time>{ticket.receivedAt.slice(11, 16)}</time>
```

### FabPanel

The queue's entry point below 1200px: a floating action button (FAB) at the bottom right, and the panel it opens above itself. Its one use is the inbox (wrapped so it's hidden from 1200px, where the queue is a pane; resizing past 1200px closes it). Pass `open`, `onOpenChange`, `title` (one word, "Queue": the panel's heading and name, the button's label, and its aria-label, "Open queue" or "Close queue", with `aria-expanded`), `icon` (`inbox`) and the list as children; `onOpened` gets the panel's scrolling element, so the inbox scrolls the open ticket to the middle. Close it when a ticket is picked.

**The button.** One element, always: 44px tall, fully round, Approve's primary style (`--button-primary-bg`, an `--accent-ink` icon and label, the primary hover; a documented exception to rule 4), a 20px icon, `--shadow-fab` (Approve's edge and highlight with a soft lift in light mode; dark mode has no shadows, so just the edge), and a 0.96 press scale. Fixed 16px from the right and 16px from the bottom, plus the safe-area inset. **Collapsed:** 44 × 44, 12px padding on both sides, the icon centered. **Extended:** the icon, then "Queue" in the heading font (Schibsted Grotesk) at 14px, weight 550, 6px after it, with 14px padding on the left and 16px on the right. It's extended only when the page is scrolled to the very top and the panel is closed: any scroll down collapses it, only the very top extends it again, and it never changes while the panel is open. It's extended in the server HTML, so a page that loads at the top never moves it.

**Open and closed.** The button never moves or turns into the panel; it stays on top of the open panel and becomes the close control (a ×). Opening, if it's extended it collapses as the inbox icon turns into the ×; closing, the × turns back and, at the very top, it extends again, mirroring the opening. It closes on the button, a scrim tap, Escape, and picking a ticket. How each of these moves is in Motion.

**The panel.** 12px above the button, 20px corners, `--surface-raised`, `--shadow-dialog`, a "Queue" heading (`text-heading`, 16px in from the edges, a hairline below) and its own scrolling list (overscroll contained, inset 4px so rows line up with the title). Phones: as wide as the email and triage panes (16px side margins), from just below the app header (56px from the top) to just above the button. Tablets (768px and up): 380px wide, 16px from the right, up to 640px tall. The `--scrim` covers the page behind it.

**Built like this, on purpose.** The scrim, the panel and the button are popovers in the top layer, shown in that order, and the button is re-shown after the panel so it's on top. Its display is set in CSS, so it's visible from the first paint and stays displayed when it leaves or rejoins the top layer (no flicker, no restarted transitions). The panel is **not** a modal `<dialog>`: a modal makes everything outside it inert, the button included, which forces a second, duplicate button inside it, and swapping between the two stutters. It's managed like a dialog instead: `role="dialog"` and `aria-label="Queue"`; focus moves into the panel itself on open (`tabIndex={-1}`, no outline, so a tap shows no ring) and back to the button on close; everything else on the page is `inert`, so Tab moves through the list and then the button; page scroll is locked while it's open. Focus moves with an explicit ring choice (`focusVisible`): no ring after a tap or click, the usual ring after a key (Escape, Enter on a ticket), because the browser's own guess carries a ring over from the element losing focus even after a tap. Never remove the controls' focus-visible styles.

```tsx
// Correct
<FabPanel open={queueOpen} onOpenChange={setQueueOpen} title="Queue" icon="inbox" onOpened={centerCurrent}>
  {queueList}
</FabPanel>

// Incorrect: a modal dialog with its own close button; the FAB goes inert behind it and needs a duplicate
<dialog open={queueOpen}><IconButton icon="close" aria-label="Close queue" />{queueList}</dialog>
```

### Timeline

The activity record, collapsed by default behind "Activity · <count>". Children are TimelineRows, oldest first.

```tsx
// Correct
<Timeline>
  <TimelineRow actor="ai" at={suggestion.suggestedAt}>suggested How-to and Normal urgency, and drafted a reply</TimelineRow>
</Timeline>

// Incorrect: rows in a bare list, always open
<ol>{rows}</ol>
```

### Severity

How urgent a ticket is: `urgent`, `high`, `normal`, `low`. Only urgent is a solid fill; the bars repeat the level, and the word is always shown. For the model's suggested urgency as a field value, use a Chip ("High"); Severity is the ticket's level shown in lists and headers.

```tsx
// Correct
<Severity level="high" />

// Incorrect: a red Tag isn't a severity; it loses the bars and the level scale
<Tag tone="warning">High</Tag>
```

### SegmentedControl

Choosing one of two to five views or filters, where every option fits on one line. More options, or options that need a search, go in a menu. It's a radio group, so `aria-label` is required. Use `defaultValue` for uncontrolled, or `value` with `onValueChange`. Fully rounded (`--button-radius`); the selected option is neutral (raised like a secondary button), never Petrol. An option may take an `icon` (`IconName`): only the icon shows and `label` becomes its accessible name. ThemeToggle is this, with a monitor, a sun and a moon.

```tsx
// Correct
<SegmentedControl aria-label="Inbox filter" options={[{ value: "review", label: "Needs review" }, { value: "all", label: "All" }]} />

// Incorrect: actions aren't a choice of view; use Buttons
<SegmentedControl aria-label="Actions" options={[{ value: "approve", label: "Approve" }, { value: "discard", label: "Discard" }]} />
```

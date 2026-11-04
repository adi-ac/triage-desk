# Triage Desk design system

Read this and `docs/brief.md` before building any UI. The brief says why; this file says what to use. Tokens are in `styles/`, components in `components/ui`, and `/system` shows every token and component in both themes.

The product's one idea: the interface makes it obvious when the model shouldn't be trusted. Every rule below protects that idea.

## Project rules

These hold on every screen. If a design seems to need an exception, ask; don't make one.

1. **Anything Claude produced renders as a suggestion until a person acts on it.** Suggestions are pencil: dashed `--suggested-border`, gray. Use `Chip state="suggested"`, `Tag tone="ai"`, `TimelineRow actor="ai"`, `DraftEditor state="suggested"`. It becomes decided, edited or approved only when a person sets, edits or approves it. Why: if model output looks like a decision, nobody can tell what was checked.
2. **A confidence value always shows as `ConfidenceMeter`: a bar, a percentage and a level word.** Confidence is Claude's own estimate, not a measured probability: never word it as a measurement ("92% accurate", "92% chance"), and say "Claude's estimate" wherever the interface explains it. **Never as a chip or a tag**, and never as a bare number. The one exception is history: once a field is kept or switched, FieldReview replaces its meter with a quiet note, "Claude suggested How-to · 48%". Why: high confidence shares Petrol with decisions, so shape and words are what keep them apart; and confidence belongs to suggestions, so a meter beside a value must never show confidence in a different value.
3. **A decided chip always says how it was decided: who set it, or "Approved as suggested".** `Chip state="decided"` requires either `decidedBy` (`"you"` or the person's name) or `asSuggested`. Why: same as rule 2. A solid petrol chip with no name could be the model.
4. **Petrol is only for decisions, high confidence, the selected queue item and Approve.** Decisions means anything a person set: `Chip state="decided"`, `Tag tone="human"`, `TimelineRow actor="human"`. The focus ring (`--focus-ring`, the accent) is the one documented exception: keyboard focus must always be clearly visible, and it only appears while tabbing, so it never competes with Approve. Nothing else uses an `--accent*`, `--decided-*` or `--confidence-high*` token: no petrol links, info banners, headings or icons. A reply a team rule sent has no decision styling, since no person acted: no ink chips, no "Set by you" (FieldReview `readOnly`, DraftEditor `state="sent-by-rule"`, ApproveBar `sentBy="rule"`). Its high-confidence meters stay Petrol like any other: the meter describes the model's confidence, not a decision. There are no per-ticket-type exceptions to this rule. Why: Petrol means "a person did this" or "fine to go ahead". A third meaning breaks both.
5. **Approve stays disabled while any blocker is open, and the blockers are listed next to it.** Exactly three things block, and nothing else:
   - an unsure field that no one has kept or switched: under 60%, or within 15 points of its runner-up;
   - any unfilled `[placeholder]` in the draft;
   - an empty draft.

   Get them from `approveBlockers()` in `@/lib/approve`; never write your own checks. It returns one `{ target, message }` per blocker: `target` is the field's name or `"draft"`, and `message` is a sentence with the number that tripped it.

   Approve lives in the triage pane's pinned footer, as `ApproveBar` in Pane's `footer`. ApproveBar shows the button and a one-line summary ("3 things to resolve: Category, Urgency, Draft") whose items jump to where each is fixed. There is no separate blocker list: each reason sits where it's fixed. An unsure field shows it in its meter's hint; the draft gets the blocker's `message` as DraftEditor's `blocker`, and its unfilled placeholders are highlighted in the text. Never hide Approve until the reply is sent; never leave it enabled while a blocker is open; never pin it with negative margins or `position: sticky` of your own.

   The one exception: a ticket with no model output has no Approve. Its triage pane says plainly that Claude hasn't triaged it yet, and has no footer.

   After sending, ApproveBar swaps the button for "Sent by you · <time>" and a secondary button: "Next ticket" in the inbox (`afterSend="next-ticket"`), "Back to inbox" for a ticket opened on its own (`afterSend="back-to-inbox"`). The draft becomes `state="approved"` (read-only), and the timeline gets a row: "approved and sent the reply". A draft written for a value a person has since overridden is a warning, not a blocker: pass it as DraftEditor's `warning`. Why: block only where a wrong send is costly; Approve must always be visible without layout hacks; and the reason should sit where you fix it, not in a list you read in one place and act on in another.
6. **Model output is always labeled with its source: recorded, live or hand-written.** Every screen that shows model output carries exactly one `OutputSource`, which can't be dismissed. Hand-written output is allowed during the build only and must be replaced by recorded output before shipping. LL-5040 stays hand-written until the API key is added. Why: an unlabeled canned example undoes the honesty claim the piece rests on (brief, First screen).
7. **Approving never turns an untouched field into "Set by you".** On Approve, each field a person kept or switched shows `decidedBy="you"`; each field nobody touched shows `asSuggested`, labeled "Approved as suggested". `FieldReview` does this when you pass `approved`. The timeline gives them separate rows (see TimelineRow). Why: the record must never claim a person chose something they didn't look at.

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

Model output has one shape, `Suggestion`, in `@/lib/suggestion` (including `suggestedAt`, when the model made it), alongside `SuggestedField`, `Evidence`, `OutputSourceKind`, `EvidenceSupports` and the value lists `categories` and `urgencies`. Never define your own. Example output lives in `@/fixtures/suggestions` (`suggestionFor(ticketId)`), never in `fixtures/tickets.ts`, which holds inputs only. Show the email with `EmailBody`, passing `suggestion.evidence`; for the evidence list, `matchEvidence(body, evidence)` from `@/lib/evidence` gives the quotes that match word for word. Never search or split the email yourself.

**Times** are ISO 8601 strings everywhere in data and props, and always render through `Time` (TimelineRow, QueueItem and ApproveBar already use it). It shows the viewer's time zone: the time alone if it's today, the date and time if older, the full timestamp with its zone on hover. Never format a time yourself, and never show UTC. To check Approve, build each field with `approveField(name, suggestion.category, chosen)` and pass the fields to `approveBlockers` (both from `@/lib/approve`).

The draft is only ever words to the customer, and it's grounded in the help center (`@/fixtures/help-center`), not guessed: it may state only facts from the email or those articles, and each article it relies on is recorded as evidence (`ArticleEvidence`: `supports: "draft"`, the article's title and the sentence quoted). Evidence comes in two kinds: `EmailEvidence` backs the category or urgency and is marked in the email; `ArticleEvidence` backs the draft. `matchEvidence()` returns email evidence only. `[Placeholders]` are only for facts Claude can't know: dates, amounts, names, account details. A placeholder never sits inside a question to the customer; questions are asked in plain words. Advice or instructions for the support agent never go in the draft, not even in brackets; they go in `agentNote`, shown above the draft as "Claude's note". Why: a placeholder blocks Approve until a person fills it, and an instruction left in a draft would be sent to the customer.

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

**Trust tokens** (`styles/trust.css`) name meanings: `--suggested-*`, `--decided-*`, `--evidence-*`, `--confidence-*`, `--severity-*`. Every meaning has a component (Chip, FieldReview, EmailBody, EvidenceMark, EvidenceItem, ConfidenceMeter, Severity, DraftEditor, OutputSource, ApproveBar); use the component, not the tokens. A new meaning gets a new component in `components/ui`, never inline styles on a screen.

**Type:** use the role classes from `styles/type.css`: `text-title` (20), `text-heading` (16), `text-subheading` (14), `text-body` / `text-body-strong` (14), `text-reading` (the email), `text-small` (13), `text-overline` (12, uppercase labels), `text-mono` / `text-mono-small` (IDs, times, figures). Never set a one-off font size, and never go below 12px.

**Themes:** dark mode follows the system unless `<html data-theme>` says otherwise. `data-theme="light"` or `"dark"` also works on any element, to show one theme inside the other. Set `background` and `color` on that element yourself.

## Layout

Screens are built from `Pane`s in a shell grid. Never hand-build a tray, a card or their corners.

**Shell** (the screen's `<main>`; the page background is already `--page`). Padding 16px below 768px, 24px from 768px. Gap between panes: 16px. A header row (screen title, and the `OutputSource` when the screen shows model output) spans every column. Nothing ever scrolls sideways.

With a queue (the inbox, where a person works through tickets). The inbox is `/tickets/[id]`, so every open ticket has its own URL; `/` redirects to the first-screen ticket. Read the ID with `useParams()` in a client component, never by awaiting `params` in the page: with Cache Components on, server-side `params` blocks instant navigation between tickets. Its header row holds the screen title, the open ticket's `OutputSource` (when it has model output) and, below 1200px, the "Queue" Button.

| Width | Columns |
| --- | --- |
| 1200px and up | `320px minmax(0, 1fr) 400px`: queue, email, triage. The shell is `100dvh` tall and each pane's card scrolls on its own. |
| 768–1199px | `minmax(0, 1fr) 360px`: email, triage. The queue moves behind a secondary "Queue" Button in the header row, which opens it in a `Sheet` with the open ticket highlighted and scrolled into view; picking a ticket or Escape closes it. |
| Below 768px | One column: email, then triage. The "Queue" Button stays in the header; the Sheet is full width. |

**Queue order** comes from `orderQueue()` in `@/lib/queue`; never sort it yourself. Three groups, top to bottom, each headed in `text-overline`:

1. **Needs review**: triaged and not yet sent. High stakes before normal, then the least sure first. High stakes means the category is Billing or Cancellation risk, or the urgency is Urgent, counting the runner-up as well as the top pick; once a person decides a field, only their value counts. Why: when Claude is unsure, assume the higher stakes, so a likely cancellation can't sink just because the top guess was How-to.
2. **Not triaged yet**: no model output, newest first, each with a neutral "Not triaged" Tag.
3. **Sent**: sent by a person or a rule, most recently sent first, each keeping its "Sent" or "Sent by rule" Tag.

The order is computed when a ticket opens and held while it's open: the queue re-sorts only when a different ticket opens, or on reload. Tags still update live. Why: a row must never move out from under the person working on it.

The browser tab reads "<ticket ID> · Triage Desk", set on the client because the page can't read the ID on the server: the ticket panes render a React `<title>`, and no layout or page above them sets a metadata title (Next would overwrite it on navigation).

**Triage pane, top to bottom:** Category, then Urgency (each a FieldReview with its own evidence beneath it; hovering or focusing a quote marks it in the email), then Claude's note if there is one (`Banner` info titled "Claude's note", from `suggestion.agentNote`), then the draft, then the activity `Timeline` (collapsed, "Activity · 3"). Approve is in the footer. The first field still showing a meter gets `explainEstimate`, so the pane says once, under that meter, "Confidence is Claude's estimate, not a measured probability."

Without a queue (a single ticket opened on its own, from a link): the same shell minus the queue column. That's not an exception, so don't ask about it. After sending, ApproveBar offers "Back to inbox" instead of "Next ticket".

| Width | Columns |
| --- | --- |
| 1200px and up | `minmax(0, 1fr) 400px`: email, triage, `100dvh` tall, each card scrolling on its own. |
| 768–1199px | `minmax(0, 1fr) 360px`: email, triage. |
| Below 768px | One column: email, then triage. |

**Pane** is the only pane: a `--tray` band (14px corners, 4px padding, `--shadow-pane`) holding a header (`text-heading` title, optional meta) and a `--surface` card (10px corners, 16px padding). Corners are concentric: inner radius = outer radius − the padding between them.

**Other corners:** popovers and menus 10px, dialogs 14px. Components own their corners (4–8px); never override them.

## Components

Import every component and its props type from `@/components/ui`, never from a component's own file (`@/components/ui/chip`). ESLint rejects the file path. Data types such as `EvidenceSupports` come from `@/lib/suggestion`, not from a component. No component accepts `className` or `style`. The variant unions below are the complete set: an unlisted variant is a bug, not an option. Lay components out from the parent's own CSS module, and never restyle them.

### Button

Use for actions. Navigation is a link, not a Button.

- `primary`: Approve, and nothing else (rule 4). One per screen.
- `danger`: discarding or undoing something a person made. Red text on secondary chrome, so it never outweighs Approve.
- `secondary`: everything else. This is the default.
- `size="small"`: inside a Banner, a table row or a toolbar. Otherwise `default`.

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

### Tag

A short label inside a row. A field value is a Chip.

- `neutral` (the default): categories and plain facts ("Billing").
- `warning`: needs a person ("Needs review").
- `success`: done ("Sent").
- `ai`: the model or a team rule acted ("Sent by rule"). Pencil.
- `human`: a person acted ("Edited"). Petrol, so only under rule 4.

```tsx
// Correct
<Tag tone="ai">Sent by rule</Tag>

// Incorrect: a confidence value as a tag breaks rule 2
<Tag tone="success">92%</Tag>
```

### FieldReview

Reviewing one suggested field: category or urgency. Use it for every field a person reviews; never assemble chips, meters and buttons yourself.

- While suggested: the dashed chip, the ConfidenceMeter, and three small secondary Buttons: "Keep", "Switch to <runner-up>" and "Other…", which opens the full list. The override is one click, and none of these competes with Approve.
- Once kept or switched: the solid chip ("Set by you") and a quiet "Change" link that reopens the controls. The meter gives way to a quiet note, "Claude suggested How-to · 48%" (rule 2).
- `approved`: locks the field. An untouched field shows "Approved as suggested" (rule 7).
- `readOnly`: a reply a team rule sent. The chip stays pencil and the meter stays (Petrol if it's high confidence); no controls, no decision styling.
- `explainEstimate`: shows "Confidence is Claude's estimate, not a measured probability." under the meter. Pass it to the first field that still shows a meter, so it appears once per pane.
- `evidence`: this field's quotes, from `matchEvidence()` filtered by `supports`, listed beneath it. Pass `onEvidenceActive` and keep the quote in screen state for EmailBody's `activeQuote`; the quotes then respond to hover and keyboard focus.

It's controlled: keep `value` (null until someone keeps or switches) on the screen, because the Approve blockers need it. Give it an `id` and pass that in ApproveBar's `targets`, so the summary can jump to it. `options` is `categories` or `urgencies` from `@/lib/suggestion`. Its heading is an h3, so put it in a Pane. After each choice, add a timeline row: "kept the category as How-to" or "set the category to Billing".

```tsx
// Correct
<FieldReview id="field-category" label="Category" field={suggestion.category} options={categories} value={category} onValueChange={setCategory} approved={sent} />

// Incorrect: hand-built review controls; primary-looking buttons compete with Approve
<Chip state="suggested">How-to</Chip>
<Button variant="primary" onClick={keep}>Keep</Button>
```

### Chip

A field's value (category, urgency) shown on its own, such as in a list or a header. A field under review is a FieldReview. A short label in a row is a Tag; a choice between views is a SegmentedControl.

- `suggested`: the model's value, not yet acted on (rule 1).
- `decided`: decided by a person. Requires `decidedBy="you"` (or a name) when a person kept or switched it, or `asSuggested` when it was approved untouched (rules 3 and 7).
- `default`: an option nobody has picked, such as the runner-up.
- `aiPick`: true on whichever chip holds the model's pick. It adds the words "AI pick", so the pick survives a person's override.

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

The only way to show a confidence value (rule 2). The value is Claude's own estimate, not a measured probability; every meter's accessible name says so ("Confidence: Claude's estimate, not a measured probability"), and the triage pane says it once in words (FieldReview `explainEstimate`). There's no hover-only explanation. Pass `value` from 0 to 1, and `runnerUp` (the runner-up's 0–1 confidence) whenever there is one. The level comes from the rounded percentage: high from 85%, medium from 60%, low below. You can't pass a level. Low adds a fill. An unsure pick (under 60%, or within 15 points of `runnerUp`) adds "confirm before approving" until you pass `confirmed` once a person has kept or switched the field. It wraps on narrow screens; never put it in a horizontally scrolling container. It's a block element, so don't put it inside a QueueItem's `meta`; use a `Tag tone="warning"` there.

```tsx
// Correct
<ConfidenceMeter value={0.71} runnerUp={0.64} confirmed={kept} />

// Incorrect: a level can't be passed (type error); it would let the figure and the word disagree
<ConfidenceMeter value={0.64} level="high" />
```

### EmailBody

The customer's email. Pass `body` and the model's `evidence`; it splits paragraphs, keeps line breaks, marks each quote in place with EvidenceMark, and drops any quote that doesn't match the email word for word. `activeQuote` (from FieldReview's `onEvidenceActive`) turns that quote's dashed underline solid and 2px, and scrolls it into view if it's out of sight (instantly with reduced motion). A quote cited for both fields is marked once, in urgency red (red means it raises the stakes), and the evidence item under either field highlights that same mark.

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

- `actor="ai"`: the model or a team rule. `name` defaults to "Model"; pass "Team rule" for rules. Dashed ring.
- `actor="human"`: a person. `name` is required. Solid petrol dot.

On Approve, a field a person kept or switched already has its own row ("set the category to Cancellation risk"). Each untouched field gets a separate row that says so: "approved the urgency as suggested: Normal". Never fold the two together (rule 7).

```tsx
// Correct
<TimelineRow actor="ai" name="Team rule" at="2026-11-02T16:31:00Z">sent the reply without review</TimelineRow>

// Incorrect: an automatic send recorded as a person's act breaks rule 1
<TimelineRow actor="human" name="Team rule" at="2026-11-02T16:31:00Z">sent the reply without review</TimelineRow>
```

### Banner

A message about the whole view. A message about one field goes beside that field as `text-small`.

- `info` (the default): neutral facts. Gray with a hairline ring, never petrol. Model output's source is not a Banner you write: use `OutputSource` (rule 6).
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

One ticket in the inbox list. `current` marks the ticket open beside the queue with a petrol tint (rule 4); only one item is `current`. `meta` takes Tags only.

```tsx
// Correct
<QueueItem current sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" receivedAt={ticket.receivedAt} meta={<Tag tone="warning">Needs review</Tag>} />

// Incorrect: a confidence value as a tag (rule 2), and a meter here would be a block inside a button
<QueueItem sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" receivedAt={ticket.receivedAt} meta={<Tag>92%</Tag>} />
```

### DraftEditor

The reply draft. `state` is required; the label shows it in words ("Draft reply · Suggested").

- `suggested`: the model's draft, untouched. Pencil: dashed border (rule 1). The first change a person types shows it as `edited` and calls `onStateChange("edited")`. Give each new draft its own `key`, so it starts suggested again.
- `edited`: a person changed it, or wrote it from scratch. Solid control border.
- `approved`: approved or sent by a person. Read-only, in the decided style (rule 4).
- `sent-by-rule`: sent by a team rule without review. Read-only and still pencil; no decision styling.

`blocker` takes the draft's blocker message from `approveBlockers()` and shows it under the draft (rule 5). Unfilled `[placeholders]` are always highlighted in the text: a `--warning-soft` fill with a dashed `--warning` underline.

`note` says who drafted it, in every state ("Drafted by the model, edited by you"). `warning` shows something to check that doesn't block Approve, such as "The draft was written for How-to; the category is now Cancellation risk." Use `defaultValue` when the editor owns the text, or `value` and `onChange` when the screen does.

```
Has a person approved or sent it?     → state="approved"
Has a person typed in it, or written it? → state="edited"
Is it the model's draft, untouched?   → state="suggested"
```

```tsx
// Correct
<DraftEditor key={ticket.id} label="Draft reply" state="suggested" onStateChange={setDraftState} note="Drafted by the model" defaultValue={draft} />

// Incorrect: a model draft shown as a person's edit breaks rule 1, and the note is missing
<DraftEditor label="Draft reply" state="edited" defaultValue={draft} />
```

### OutputSource

The label for model output (rule 6). `source` is `recorded`, `live` or `hand-written`; the wording is fixed. Recorded and live are info; hand-written is a warning, because it must be replaced before shipping. One per screen, near the top, never dismissible.

```tsx
// Correct
<OutputSource source="hand-written" />

// Incorrect: a hand-written label with softened wording
<Banner title="Example">Sample suggestions for this ticket.</Banner>
```

### Pane

Every pane on a screen (see Layout). `title` names it; `meta` takes a short fact or a Tag, such as the ticket ID. Never put a model suggestion in `meta`, such as an unconfirmed urgency as a Severity; the header reads as settled (rule 1). Children go in the card, which scrolls on its own when the shell gives the pane a height. `footer` stays pinned at the bottom of the card; the triage pane puts ApproveBar there, and nothing else goes in a footer.

```tsx
// Correct: meta holds facts, never a model suggestion (rule 1)
<Pane title="Email" meta={<span className="text-mono-small">{ticket.id}</span>}>{children}</Pane>

// Incorrect: a hand-built tray with its own corners
<section className={styles.tray}><div className={styles.card}>{children}</div></section>
```

### ApproveBar

Approve and what follows it; it only goes in the triage Pane's `footer` (rule 5). Before sending: the primary "Approve and send" button, disabled while any blocker is open, and a one-line summary whose items jump to where each is fixed (`targets` maps each blocker target to an element id). After sending (`sentAt` set): "Sent by you · <time>", or "Sent by rule · <time>" with `sentBy="rule"`, and "Next ticket" or "Back to inbox" (`afterSend`).

```tsx
// Correct: a ticket opened on its own, outside the inbox
<ApproveBar blockers={blockers} targets={targets} onApprove={approve} sentAt={sentAt} afterSend="back-to-inbox" onAfterSend={backToInbox} />

// Incorrect: Next ticket where there's no queue to go to
<ApproveBar … afterSend="next-ticket" onAfterSend={() => {}} />
```

### Time

Every time on screen (see Data, Times). Pass `dateTime` as ISO 8601.

```tsx
// Correct
<Time dateTime={ticket.receivedAt} />

// Incorrect: formatted by hand, and in UTC
<time>{ticket.receivedAt.slice(11, 16)}</time>
```

### Sheet

A dialog-level panel from the left: `--surface-raised`, `--shadow-dialog` and the `--scrim`; full width on phones. Focus moves in on open and back to the opener on close; Escape or a click outside closes it. The inbox's Queue button is its one use: close it when a ticket is picked.

```tsx
// Correct
<Sheet open={queueOpen} onClose={() => setQueueOpen(false)} title="Queue">{queueList}</Sheet>

// Incorrect: a hand-built overlay with its own focus handling
<div className={styles.overlay} onClick={close}>{queueList}</div>
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

Choosing one of two to five views or filters, where every option fits on one line. More options, or options that need a search, go in a menu. It's a radio group, so `aria-label` is required. Use `defaultValue` for uncontrolled, or `value` with `onValueChange`.

```tsx
// Correct
<SegmentedControl aria-label="Inbox filter" options={[{ value: "review", label: "Needs review" }, { value: "all", label: "All" }]} />

// Incorrect: actions aren't a choice of view; use Buttons
<SegmentedControl aria-label="Actions" options={[{ value: "approve", label: "Approve" }, { value: "discard", label: "Discard" }]} />
```

# Triage Desk design system

Read this and `docs/brief.md` before building any UI. The brief says why; this file says what to use. Tokens are in `styles/`, components in `components/ui`, and `/system` shows every token and component in both themes.

The product's one idea: the interface makes it obvious when the model shouldn't be trusted. Every rule below protects that idea.

## Project rules

These hold on every screen. If a design seems to need an exception, ask; don't make one.

1. **Anything Claude produced renders as a suggestion until a person acts on it.** Suggestions are pencil: dashed `--suggested-border`, gray. Use `Chip state="suggested"`, `Tag tone="ai"`, `TimelineRow actor="ai"`, `DraftEditor state="suggested"`. It becomes decided, edited or approved only when a person sets, edits or approves it. Why: if model output looks like a decision, nobody can tell what was checked.
2. **A confidence value always shows as `ConfidenceMeter`: a bar, a percentage and a level word. Never as a chip or a tag**, and never as a bare number. Why: high confidence shares Petrol with decisions, so shape and words are what keep them apart.
3. **A decided chip always says how it was decided: who set it, or "Approved as suggested".** `Chip state="decided"` requires either `decidedBy` (`"you"` or the person's name) or `asSuggested`. Why: same as rule 2. A solid petrol chip with no name could be the model.
4. **Petrol is only for decisions, high confidence, the selected queue item and Approve.** Decisions means anything a person set: `Chip state="decided"`, `Tag tone="human"`, `TimelineRow actor="human"`. The focus ring (`--focus-ring`, the accent) is the one documented exception: keyboard focus must always be clearly visible, and it only appears while tabbing, so it never competes with Approve. Nothing else uses an `--accent*`, `--decided-*` or `--confidence-high*` token: no petrol links, info banners, headings or icons. Why: Petrol means "a person did this" or "fine to go ahead". A third meaning breaks both.
5. **Approve stays disabled while any blocker is open, and the blockers are listed next to it.** Exactly three things block, and nothing else:
   - an unsure field that no one has kept or switched: under 60%, or within 15 points of its runner-up;
   - any unfilled `[placeholder]` in the draft;
   - an empty draft.

   Get them from `approveBlockers()` in `@/lib/approve`; never write your own checks. It returns one sentence per blocker, with the number that tripped it. Show them in a `Banner tone="warning"` titled "Approve is blocked" beside the button, linked with `aria-describedby`. Never hide Approve; never leave it enabled while a blocker is open. A draft written for a value a person has since overridden is a warning, not a blocker: pass it as DraftEditor's `warning`. Why: block only where a wrong send is costly.
6. **Model output is always labeled with its source: recorded, live or hand-written.** Every screen that shows model output carries exactly one `OutputSource`, which can't be dismissed. Hand-written output is allowed during the build only and must be replaced by recorded output before shipping. LL-5040 stays hand-written until the API key is added. Why: an unlabeled canned example undoes the honesty claim the piece rests on (brief, First screen).
7. **Approving never turns an untouched field into "Set by you".** On Approve, each field a person kept or switched shows `decidedBy="you"`; each field nobody touched shows `asSuggested`, labeled "Approved as suggested". The timeline gives them separate rows (see TimelineRow). Why: the record must never claim a person chose something they didn't look at.

```tsx
// Correct: rule 5
const blockers = approveBlockers({ fields, draft });

<Button variant="primary" disabled={blockers.length > 0} aria-describedby="approve-blockers">
  Approve and send
</Button>
{blockers.length > 0 && (
  <Banner id="approve-blockers" tone="warning" title="Approve is blocked">
    {blockers.map((b) => <p key={b}>{b}</p>)}
  </Banner>
)}

// Incorrect: a home-made blocker (a stale draft is a warning), and no reason beside the button
<Button variant="primary" disabled={draftIsStale}>Approve and send</Button>
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

**Trust tokens** (`styles/trust.css`) name meanings: `--suggested-*`, `--decided-*`, `--evidence-*`, `--confidence-*`, `--severity-*`. Every meaning has a component (Chip, EvidenceMark, EvidenceItem, ConfidenceMeter, Severity, DraftEditor, OutputSource); use the component, not the tokens. A new meaning gets a new component in `components/ui`, never inline styles on a screen.

**Type:** use the role classes from `styles/type.css`: `text-title` (20), `text-heading` (16), `text-subheading` (14), `text-body` / `text-body-strong` (14), `text-reading` (the email), `text-small` (13), `text-overline` (12, uppercase labels), `text-mono` / `text-mono-small` (IDs, times, figures). Never set a one-off font size, and never go below 12px.

**Themes:** dark mode follows the system unless `<html data-theme>` says otherwise. `data-theme="light"` or `"dark"` also works on any element, to show one theme inside the other. Set `background` and `color` on that element yourself.

## Layout

Screens are built from `Pane`s in a shell grid. Never hand-build a tray, a card or their corners.

**Shell** (the screen's `<main>`; the page background is already `--page`):

- Padding 16px below 768px, 24px from 768px. Gap between panes: 16px.
- From 1200px: three columns, `320px minmax(0, 1fr) 400px`: queue, email, triage. The shell is `100dvh` tall and each pane's card scrolls on its own.
- 768–1199px: two columns, `minmax(0, 1fr) 360px`: email, triage. The queue moves behind a "Queue" Button in the screen header.
- Below 768px: one column, in the order email, triage. Nothing scrolls sideways.

**Pane** is the only pane: a `--tray` band (14px corners, 4px padding, `--shadow-pane`) holding a header (`text-heading` title, optional meta) and a `--surface` card (10px corners, 16px padding). Corners are concentric: inner radius = outer radius − the padding between them.

**Other corners:** popovers and menus 10px, dialogs 14px. Components own their corners (4–8px); never override them.

## Components

Import from `@/components/ui`. No component accepts `className` or `style`. The variant unions below are the complete set: an unlisted variant is a bug, not an option. Lay components out from the parent's own CSS module, and never restyle them.

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

### Chip

A field's value (category, urgency). A short label in a row is a Tag; a choice between views is a SegmentedControl.

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

The only way to show a confidence value (rule 2). Pass `value` from 0 to 1, and `runnerUp` (the runner-up's 0–1 confidence) whenever there is one. The level comes from the rounded percentage: high from 85%, medium from 60%, low below. You can't pass a level. Low adds a fill. An unsure pick (under 60%, or within 15 points of `runnerUp`) adds "confirm before approving" until you pass `confirmed` once a person has kept or switched the field. It wraps on narrow screens; never put it in a horizontally scrolling container. It's a block element, so don't put it inside a QueueItem's `meta`; use a `Tag tone="warning"` there.

```tsx
// Correct
<ConfidenceMeter value={0.71} runnerUp={0.64} confirmed={kept} />

// Incorrect: a level can't be passed (type error); it would let the figure and the word disagree
<ConfidenceMeter value={0.64} level="high" />
```

### EvidenceMark

A quote the model used, marked inside the email body: a fill and a dashed underline. `supports` is `category` (gray) or `urgency` (red). Wrap the exact words; drop any quote that doesn't match the email word for word.

```tsx
// Correct
Our <EvidenceMark supports="urgency">renewal is on 15 December</EvidenceMark>.

// Incorrect: a hand-built mark; use the component
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

One entry in an activity timeline. Rows go in an `<ol>` with its list styles reset.

- `actor="ai"`: the model or a team rule. `name` defaults to "Model"; pass "Team rule" for rules. Dashed ring.
- `actor="human"`: a person. `name` is required. Solid petrol dot.

On Approve, a field a person kept or switched already has its own row ("set the category to Cancellation risk"). Each untouched field gets a separate row that says so: "approved the urgency as suggested: Normal". Never fold the two together (rule 7).

```tsx
// Correct
<TimelineRow actor="ai" name="Team rule" time="16:31">sent the reply without review</TimelineRow>

// Incorrect: an automatic send recorded as a person's act breaks rule 1
<TimelineRow actor="human" name="Team rule" time="16:31">sent the reply without review</TimelineRow>
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
<QueueItem current sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" time="16:48" meta={<Tag tone="warning">Needs review</Tag>} />

// Incorrect: a confidence value as a tag (rule 2), and a meter here would be a block inside a button
<QueueItem sender="Aisha Kamara" subject="Exporting all our invoices" preview="Could you tell me…" time="16:48" meta={<Tag>92%</Tag>} />
```

### DraftEditor

The reply draft. `state` is required; the label shows it in words ("Draft reply · Suggested").

- `suggested`: the model's draft, untouched. Pencil: dashed border (rule 1). The first change a person types shows it as `edited` and calls `onStateChange("edited")`. Give each new draft its own `key`, so it starts suggested again.
- `edited`: a person changed it, or wrote it from scratch. Solid control border.
- `approved`: approved or sent. Read-only, in the decided style (rule 4).

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

Every pane on a screen (see Layout). `title` names it; `meta` takes a short line or a Tag, such as the ticket ID. Children go in the card.

```tsx
// Correct
<Pane title="Triage" meta={<Severity level="high" />}>{children}</Pane>

// Incorrect: a hand-built tray with its own corners
<section className={styles.tray}><div className={styles.card}>{children}</div></section>
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

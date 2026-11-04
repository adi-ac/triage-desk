# Triage Desk design system

Read this and `docs/brief.md` before building any UI. The brief says why; this file says what to use. Tokens are in `styles/`, components in `components/ui`, and `/system` shows every token and component in both themes.

The product's one idea: the interface makes it obvious when the model shouldn't be trusted. Every rule below protects that idea.

## Project rules

These hold on every screen. If a design seems to need an exception, ask; don't make one.

1. **Anything Claude produced renders as a suggestion until a person acts on it.** Suggestions are pencil: dashed `--suggested-border`, gray. Use `Chip state="suggested"`, `Tag tone="ai"`, `TimelineRow actor="ai"`. It becomes `decided` only when a person sets, edits or approves it. Why: if model output looks like a decision, nobody can tell what was checked.
2. **A confidence value always shows as `ConfidenceMeter`: a bar, a percentage and a level word. Never as a chip or a tag**, and never as a bare number. Why: high confidence shares Petrol with decisions, so shape and words are what keep them apart.
3. **A decided chip always says who set it.** `Chip state="decided"` requires `decidedBy`; pass `"you"` or the person's name. Why: same as rule 2. A solid petrol chip with no name could be the model.
4. **Petrol is only for decisions, high confidence, the selected queue item and Approve.** Decisions means anything a person set: `Chip state="decided"`, `Tag tone="human"`, `TimelineRow actor="human"`. The one other use is the focus ring (`--focus-ring` is the accent, decided in the brief). Nothing else uses an `--accent*`, `--decided-*` or `--confidence-high*` token: no petrol links, info banners, headings or icons. Why: Petrol means "a person did this" or "fine to go ahead". A third meaning breaks both.
5. **Approve stays disabled while any blocker is open, and the blockers are listed next to it.** Each blocker is a sentence with the number that tripped it ("The top two categories are 0.07 apart, below the 0.15 margin."). Use a `Banner tone="warning"` titled "Approve is blocked" beside the button, linked with `aria-describedby`. Never hide Approve; never leave it enabled with a warning. Why: the first screen's whole point is that the interface stops a send it shouldn't trust, and says why.
6. **Recorded examples are always labeled as recorded.** Any screen showing recorded model output carries a `Banner` (info) titled "Recorded example". It can't be dismissed. Why: an unlabeled canned example undoes the honesty claim the piece rests on (brief, First screen).

```tsx
// Correct: rule 5
<Button variant="primary" disabled={blockers.length > 0} aria-describedby="approve-blockers">
  Approve and send
</Button>
<Banner id="approve-blockers" tone="warning" title="Approve is blocked">
  {blockers.map((b) => <p key={b}>{b}</p>)}
</Banner>

// Incorrect: blocked with no reason beside it
<Button variant="primary" disabled>Approve and send</Button>
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

**Trust tokens** (`styles/trust.css`) name meanings: `--suggested-*`, `--decided-*`, `--evidence-*`, `--confidence-*`, `--severity-*`. When a component exists for the meaning, use the component, not the tokens. Severity has tokens but no component yet. If you need one, build it in `components/ui` from `--severity-*`; don't style it inline on a screen.

**Type:** use the role classes from `styles/type.css`: `text-title` (20), `text-heading` (16), `text-subheading` (14), `text-body` / `text-body-strong` (14), `text-reading` (the email), `text-small` (13), `text-overline` (12, uppercase labels), `text-mono` / `text-mono-small` (IDs, times, figures). Never set a one-off font size, and never go below 12px.

**Themes:** dark mode follows the system unless `<html data-theme>` says otherwise. `data-theme="light"` or `"dark"` also works on any element, to show one theme inside the other. Set `background` and `color` on that element yourself.

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
- `decided`: a person set it. Requires `decidedBy` (rule 3).
- `default`: an option nobody has picked, such as the runner-up.
- `aiPick`: true on whichever chip holds the model's pick. It adds the words "AI pick", so the pick survives a person's override.

```
Did a person set it?           → state="decided" decidedBy="you"
Did the model propose it?      → state="suggested"
Is it an unpicked alternative? → state="default" (add aiPick if it's the model's pick)
```

```tsx
// Correct
<Chip state="decided" decidedBy="you" aiPick>How-to</Chip>

// Incorrect: model output shown as decided, and no decidedBy (also a type error)
<Chip state="decided">How-to</Chip>
```

### ConfidenceMeter

The only way to show a confidence value (rule 2). Pass `value` from 0 to 1. The level comes from the rounded percentage: high from 85%, medium from 60%, low below. You can't pass a level. Low adds a fill and "confirm before approving". It's a block element, so don't put it inside a QueueItem's `meta`; use a `Tag tone="warning"` there.

```tsx
// Correct
<ConfidenceMeter value={0.64} />

// Incorrect: a level can't be passed (type error); it would let the figure and the word disagree
<ConfidenceMeter value={0.64} level="high" />
```

### EvidenceItem

A quote the model used, shown in the evidence list beside the email. `supports` says which suggestion it backs, in words: `category` (gray) or `urgency` (red). Pass the quote, word for word, as children. Inside the email body, mark the same words with the `--evidence-*` tokens.

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

```tsx
// Correct
<TimelineRow actor="ai" name="Team rule" time="16:31">sent the reply without review</TimelineRow>

// Incorrect: an automatic send recorded as a person's act breaks rule 1
<TimelineRow actor="human" name="Team rule" time="16:31">sent the reply without review</TimelineRow>
```

### Banner

A message about the whole view. A message about one field goes beside that field as `text-small`.

- `info` (the default): neutral facts, including "Recorded example" (rule 6). Gray with a hairline ring, never petrol.
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

The reply draft. Use `defaultValue` when the editor owns the text, or `value` and `onChange` when the screen does. It has no pencil state, so until a person edits or approves a model draft, `note` must say who drafted it (rule 1).

```tsx
// Correct
<DraftEditor label="Draft reply" note="Drafted by the model. Edit before sending." defaultValue={draft} />

// Incorrect: a model draft with nothing saying it's a suggestion
<DraftEditor label="Reply" defaultValue={draft} />
```

### SegmentedControl

Choosing one of two to five views or filters, where every option fits on one line. More options, or options that need a search, go in a menu. It's a radio group, so `aria-label` is required. Use `defaultValue` for uncontrolled, or `value` with `onValueChange`.

```tsx
// Correct
<SegmentedControl aria-label="Inbox filter" options={[{ value: "review", label: "Needs review" }, { value: "all", label: "All" }]} />

// Incorrect: actions aren't a choice of view; use Buttons
<SegmentedControl aria-label="Actions" options={[{ value: "approve", label: "Approve" }, { value: "discard", label: "Discard" }]} />
```

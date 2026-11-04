import { useState, type ReactNode } from "react";
import {
  Banner,
  Button,
  Chip,
  ConfidenceMeter,
  DraftEditor,
  EvidenceItem,
  EvidenceMark,
  FieldReview,
  OutputSource,
  Pane,
  QueueItem,
  SegmentedControl,
  Severity,
  Tag,
  TimelineRow,
  confidenceThresholds,
} from "@/components/ui";
import { suggestionFor } from "@/fixtures/suggestions";
import { autoSendTicketId, firstScreenTicketId, tickets, type Ticket } from "@/fixtures/tickets";
import { categories, urgencies, type Category, type Urgency } from "@/lib/suggestion";
import type { Pair } from "./contrast";
import { ContrastTable } from "./contrast-table";
import styles from "./system.module.css";

const firstScreen = tickets.find((t) => t.id === firstScreenTicketId)!;
const suggestion = suggestionFor(firstScreenTicketId)!;

/** Live, so the controls can be tried: each theme pane keeps its own state. */
function FieldReviewDemo() {
  const [category, setCategory] = useState<Category | null>(null);
  const [urgency, setUrgency] = useState<Urgency | null>("High");
  return (
    <>
      <FieldReview label="Category" field={suggestion.category} options={categories} value={category} onValueChange={setCategory} />
      <FieldReview label="Urgency" field={suggestion.urgency} options={urgencies} value={urgency} onValueChange={setUrgency} />
      <p className={`text-overline ${styles.muted}`}>After Approve, untouched</p>
      <FieldReview label="Urgency" field={suggestion.urgency} options={urgencies} value={null} onValueChange={() => {}} approved />
    </>
  );
}
const autoSent = tickets.find((t) => t.id === autoSendTicketId)!;

/** Pairs the components add on top of the ones theme.css and trust.css already check. */
const pairs: Pair[] = [
  { label: "Secondary button text on hover", fg: "--ink", bg: "--button-bg-hover", kind: "text" },
  { label: "Danger button text", fg: "--critical", bg: "--button-bg", kind: "text" },
  { label: "Danger button text on hover", fg: "--critical", bg: "--button-bg-hover", kind: "text" },
  { label: "Tag and banner text on surface-2", fg: "--ink-2", bg: "--surface-2", kind: "text" },
  { label: "Selected queue item text", fg: "--ink", bg: "--accent-soft", kind: "text" },
  { label: "Selected queue item company, time, preview", fg: "--ink-2", bg: "--accent-soft", kind: "text" },
  { label: "Who set it, on a decided chip", fg: "--ink-2", bg: "--decided-fill", kind: "text" },
  { label: "Low confidence hint on its fill", fg: "--ink-2", bg: "--confidence-low-fill", kind: "text" },
  { label: "Draft text in the editor", fg: "--ink", bg: "--surface", kind: "text" },
  { label: "Suggested draft text", fg: "--suggested-text", bg: "--suggested-fill", kind: "text" },
  { label: "Approved reply text", fg: "--ink", bg: "--decided-fill", kind: "text" },
  { label: "Approved reply border on surface", fg: "--decided-border", bg: "--surface", kind: "non-text" },
  { label: "Editor border on surface", fg: "--line-strong", bg: "--surface", kind: "non-text" },
];

/** Renders the same children in a light pane and a dark pane, side by side. */
function ThemePair({ children }: { children: ReactNode }) {
  return (
    <div className={styles.themePair}>
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} data-theme={theme} className={styles.themePane}>
          <p className={`text-overline ${styles.muted}`}>{theme === "light" ? "Light" : "Dark"}</p>
          {children}
        </div>
      ))}
    </div>
  );
}

function Demo({ name, props, intro, children }: { name: string; props?: string; intro: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.card}>
      <h3 className={`text-heading ${styles.cardTitle}`}>
        {name}
        {props && <code className={`text-mono-small ${styles.muted} ${styles.propsSpec}`}>{props}</code>}
      </h3>
      <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>{intro}</p>
      <ThemePair>{children}</ThemePair>
    </section>
  );
}

const time = (iso: string) => iso.slice(11, 16);
const draft =
  "Hi Aisha,\n\nThanks for checking before your renewal. You can export invoices, clients and payments from Settings → Export, as CSV with the PDFs in a zip.";
const preview = (t: Ticket) => t.body.split("\n\n")[1] ?? "";

export function ComponentsSection({ theme }: { theme: string }) {
  return (
    <>
      <Demo
        name="High confidence beside a decision"
        intro={
          <>
            Both are petrol. They should still read as different things: the meter is a bar, a
            figure and a level word with no border; the decision is a solid-bordered chip that
            names who set it.
          </>
        }
      >
        <div className={styles.compare}>
          <div className={styles.compareRow}>
            <span className={`text-small ${styles.muted}`}>Category</span>
            <Chip state="decided" decidedBy="you">
              How-to
            </Chip>
          </div>
          <div className={styles.compareRow}>
            <span className={`text-small ${styles.muted}`}>Confidence</span>
            <ConfidenceMeter value={0.92} />
          </div>
          <div className={styles.inline}>
            <ConfidenceMeter value={0.92} />
            <Chip state="decided" decidedBy="you">
              How-to
            </Chip>
          </div>
        </div>
      </Demo>

      <Demo
        name="Button"
        props="variant: primary | secondary | danger · size: default | small"
        intro="Secondary is the default. Danger keeps the secondary chrome with red text, so it never outweighs Approve. Disabled is flat in every variant."
      >
        {(["default", "small"] as const).map((size) => (
          <div key={size} className={styles.inline}>
            <Button variant="primary" size={size}>
              Approve and send
            </Button>
            <Button size={size}>Edit draft</Button>
            <Button variant="danger" size={size}>
              Discard draft
            </Button>
            <Button variant="primary" size={size} disabled>
              Approve and send
            </Button>
          </div>
        ))}
      </Demo>

      <Demo
        name="Tag"
        props="tone: neutral | warning | success | ai | human"
        intro="ai is pencil (dashed, gray); human is ink (solid, petrol)."
      >
        <div className={styles.inline}>
          <Tag>Billing</Tag>
          <Tag tone="warning">Needs review</Tag>
          <Tag tone="success">Sent</Tag>
          <Tag tone="ai">Sent by rule</Tag>
          <Tag tone="human">Edited</Tag>
        </div>
      </Demo>

      <Demo
        name="Chip"
        props="state: default | suggested | decided · decidedBy | asSuggested · aiPick: boolean"
        intro="Default is an option nobody has picked. A decided chip has to say how it was decided: who set it, or Approved as suggested when the ticket was approved without anyone touching the field. The types don't allow one without. AI pick is a word, not a color."
      >
        <div className={styles.chipGrid}>
          <Chip>Cancellation risk</Chip>
          <Chip aiPick>How-to</Chip>
          <Chip state="suggested">Normal</Chip>
          <Chip state="suggested" aiPick>
            How-to
          </Chip>
          <Chip state="decided" decidedBy="you">
            High
          </Chip>
          <Chip state="decided" decidedBy="Dana Ruiz" aiPick>
            How-to
          </Chip>
          <Chip state="decided" asSuggested>
            Normal
          </Chip>
        </div>
      </Demo>

      <Demo
        name="FieldReview"
        props="field · options · value · onValueChange · approved"
        intro="Reviewing one suggested field. While suggested: small secondary Keep, Switch to the runner-up, and Other… for the full list, so the override is one click and never competes with Approve. Once decided: the solid chip and a quiet Change link that reopens it. Try it; the data is LL-5040's hand-written suggestion."
      >
        <FieldReviewDemo />
      </Demo>

      <Demo
        name="ConfidenceMeter"
        props="value: 0–1 · runnerUp?: 0–1 · confirmed?: boolean"
        intro={
          <>
            The level is derived inside, from the rounded percentage: high from{" "}
            {confidenceThresholds.high}%, medium from {confidenceThresholds.medium}%, low below. A pick
            under {confidenceThresholds.medium}% or within {confidenceThresholds.margin} points of its
            runner-up is unsure and asks to be confirmed, until a person keeps or switches it. Always
            a bar, a figure and a word; it wraps instead of scrolling.
          </>
        }
      >
        <div className={styles.stack}>
          {[0.92, 0.85, 0.71, 0.6, 0.48].map((v) => (
            <ConfidenceMeter key={v} value={v} />
          ))}
          <p className={`text-overline ${styles.muted}`}>Within 15 points of the runner-up</p>
          <ConfidenceMeter value={0.71} runnerUp={0.64} />
          <p className={`text-overline ${styles.muted}`}>Kept or switched by a person</p>
          <ConfidenceMeter value={0.48} confirmed />
          <ConfidenceMeter value={0.71} runnerUp={0.64} confirmed />
        </div>
      </Demo>

      <Demo name="EvidenceMark" props="supports: category | urgency" intro="Marks a quote inside the email itself: a fill and a dashed underline, since the model made the mark.">
        <p className="text-reading">
          Could you tell me <EvidenceMark supports="category">how to export everything we have in Ledgerline</EvidenceMark>?{" "}
          <EvidenceMark supports="urgency">Our renewal is on 15 December</EvidenceMark>.
        </p>
      </Demo>

      <Demo name="EvidenceItem" props="supports: category | urgency" intro="The quote in the evidence list, marked as it is in the email, under the word for what it supports.">
        <div className={styles.stack}>
          <EvidenceItem supports="category">how to export everything we have in Ledgerline</EvidenceItem>
          <EvidenceItem supports="urgency">Our renewal is on 15 December</EvidenceItem>
        </div>
      </Demo>

      <Demo
        name="TimelineRow"
        props="actor: ai | human"
        intro="The model and team rules get a dashed ring; a person gets a solid dot and must be named. A field approved untouched gets its own row, worded as approved as suggested, never as set."
      >
        <ol className={styles.timeline}>
          <TimelineRow actor="ai" time="16:48">
            suggested How-to at 64%, with Cancellation risk close behind
          </TimelineRow>
          <TimelineRow actor="ai" name="Team rule" time="16:48">
            held it for review: below 85% and it mentions a renewal
          </TimelineRow>
          <TimelineRow actor="human" name="Dana Ruiz" time="16:52">
            set the category to Cancellation risk
          </TimelineRow>
          <TimelineRow actor="human" name="Dana Ruiz" time="16:55">
            approved the urgency as suggested: Normal
          </TimelineRow>
        </ol>
      </Demo>

      <Demo name="Banner" props="tone: info | warning | error" intro="Info is gray, not petrol, with a hairline ring so it stands out on a white card. The title says the tone in words and the fill carries the color, so no tone has a colored edge.">
        <div className={styles.blocks}>
          <Banner title="Sent by rule">This reply went out without review under the how-to team rule.</Banner>
          <Banner tone="warning" title="Approve is blocked" action={<Button size="small">Use runner-up</Button>}>
            The top two categories are 0.07 apart, below the 0.15 margin.
          </Banner>
          <Banner tone="error" title="Today's live-model limit is used up" action={<Button size="small">Try a recorded email</Button>}>
            Paste-your-own is back tomorrow. The recorded examples still work.
          </Banner>
        </div>
      </Demo>

      <Demo name="QueueItem" intro="Content props only. The open ticket has a petrol tint, with its secondary text stepped up to ink-2.">
        <div className={styles.queue}>
          <QueueItem
            current
            sender={firstScreen.from.name}
            company={firstScreen.account?.company}
            subject={firstScreen.subject}
            preview={preview(firstScreen)}
            time={time(firstScreen.receivedAt)}
            dateTime={firstScreen.receivedAt}
            meta={<Tag tone="warning">Needs review</Tag>}
          />
          <QueueItem
            sender={autoSent.from.name}
            company={autoSent.account?.company}
            subject={autoSent.subject}
            preview={preview(autoSent)}
            time={time(autoSent.receivedAt)}
            dateTime={autoSent.receivedAt}
            meta={<Tag tone="ai">Sent by rule</Tag>}
          />
        </div>
      </Demo>

      <Demo
        name="DraftEditor"
        props="state: suggested | edited | approved"
        intro="Suggested is the model's untouched draft, dashed like any suggestion. Type in it and it turns edited, with a solid border. Approved is read-only in the decided style. The note keeps saying who drafted it."
      >
        <DraftEditor label="Draft reply" state="suggested" rows={3} note="Drafted by the model" defaultValue={draft} />
        <DraftEditor label="Draft reply" state="edited" rows={3} note="Drafted by the model, edited by you" defaultValue={draft} />
        <DraftEditor label="Reply" state="approved" rows={3} note="Drafted by the model, approved by you at 16:55" defaultValue={draft} />
        <DraftEditor
          label="Draft reply"
          state="edited"
          rows={3}
          note="Drafted by the model, edited by you"
          warning="The draft was written for How-to; the category is now Cancellation risk. Check it still fits."
          defaultValue={draft}
        />
      </Demo>

      <Demo
        name="OutputSource"
        props="source: recorded | live | hand-written"
        intro="Every screen that shows model output carries exactly one, with fixed wording. Hand-written is for the build only and is a warning, so it can't ship unnoticed."
      >
        <div className={styles.blocks}>
          <OutputSource source="recorded" />
          <OutputSource source="live" />
          <OutputSource source="hand-written" />
        </div>
      </Demo>

      <Demo name="Pane" intro="A gray tray holding the header and wrapping a white card, with concentric corners (14px tray, 10px card). Screens never build their own.">
        <Pane title="Email" meta={<span className="text-mono-small">LL-5040</span>}>
          <p className="text-reading">Could you tell me how to export everything we have in Ledgerline?</p>
        </Pane>
      </Demo>

      <Demo
        name="Severity"
        props="level: urgent | high | normal | low"
        intro="Only urgent is a solid fill. The bars repeat the level without color, and the word is always there."
      >
        <div className={styles.inline}>
          {(["urgent", "high", "normal", "low"] as const).map((level) => (
            <Severity key={level} level={level} />
          ))}
        </div>
      </Demo>

      <Demo name="SegmentedControl" intro="Content props only. Arrow keys move and select, like native radios. The theme switch at the top of this page uses it.">
        <SegmentedControl
          aria-label="Inbox filter"
          options={[
            { value: "review", label: "Needs review" },
            { value: "rule", label: "Sent by rule" },
            { value: "all", label: "All" },
          ]}
        />
      </Demo>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Contrast</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          New pairs the components add, measured in the page theme. Switch the theme at the top to
          check the other one.
        </p>
        <ContrastTable pairs={pairs} theme={theme} />
      </section>
    </>
  );
}

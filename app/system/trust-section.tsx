import { Chip, ConfidenceMeter, DraftEditor, EmailBody, EvidenceMark, Severity } from "@/components/ui";
import { suggestionFor } from "@/fixtures/suggestions";
import { firstScreenTicketId, tickets } from "@/fixtures/tickets";
import type { Pair } from "./contrast";
import { ContrastTable } from "./contrast-table";
import styles from "./system.module.css";

const ticket = tickets.find((t) => t.id === firstScreenTicketId)!;

const draftText = "Hi Aisha, thanks for checking before your renewal. Here's what you can export…";

const pairs: Pair[] = [
  { label: "Suggestion text on its fill", fg: "--suggested-text", bg: "--suggested-fill", kind: "text" },
  { label: "Suggested chip text on its fill (recessed bg in dark)", fg: "--suggested-text", bg: "--suggested-chip-fill", kind: "text" },
  { label: "AI tag text on the suggestion fill", fg: "--ink-2", bg: "--suggested-fill", kind: "text" },
  { label: "Decision text on its fill", fg: "--decided-text", bg: "--decided-fill", kind: "text" },
  { label: "Decision border on surface", fg: "--decided-border", bg: "--surface", kind: "non-text" },
  { label: "Text on category evidence", fg: "--ink", bg: "--evidence-category", kind: "text" },
  { label: "Text on urgency evidence", fg: "--ink", bg: "--evidence-urgency", kind: "text" },
  { label: "Category evidence underline", fg: "--evidence-category-line", bg: "--evidence-category", kind: "non-text" },
  { label: "Urgency evidence underline", fg: "--evidence-urgency-line", bg: "--evidence-urgency", kind: "non-text" },
  { label: "Confidence text, doesn't block (Petrol)", fg: "--confidence-high-text", bg: "--surface", kind: "text" },
  { label: "Confidence meter, doesn't block (Petrol)", fg: "--confidence-high", bg: "--confidence-track", kind: "non-text" },
  { label: "Confidence text, blocks Approve (amber)", fg: "--confidence-low-text", bg: "--surface", kind: "text" },
  { label: "Confidence meter, blocks Approve (amber)", fg: "--confidence-low", bg: "--confidence-track", kind: "non-text" },
  { label: "Urgent", fg: "--severity-urgent-text", bg: "--severity-urgent-fill", kind: "text" },
  { label: "High severity", fg: "--severity-high-text", bg: "--severity-high-fill", kind: "text" },
  { label: "Normal severity", fg: "--severity-normal-text", bg: "--surface", kind: "text" },
  { label: "Low severity", fg: "--severity-low-text", bg: "--surface", kind: "text" },
  { label: "Focus ring on surface", fg: "--focus-ring", bg: "--surface", kind: "non-text" },
  { label: "Focus ring on bg", fg: "--focus-ring", bg: "--bg", kind: "non-text" },
];

/** LL-5040's hand-written evidence, marked the way the triage panel marks it. */
const evidence = suggestionFor(firstScreenTicketId)!.evidence;

export function TrustSection({ theme }: { theme: string }) {
  const excerpt = ticket.body.split("\n\n").slice(1, 4).join("\n\n");

  return (
    <>
      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Pencil and ink</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          Anything the model proposes is pencil: a soft gray fill with no visible border. Anything a
          person sets or approves is ink: a petrol tint with a solid petrol border, and it always
          says how it was decided: Approved as suggested on the chip, or, for a field a person kept
          or switched, the AI suggested … · n% line under it (who set it is in the chip&apos;s
          accessible name). Pencil and ink differ by color plus those words, so the words are
          never left off. Both are flat, because neither is a button.
        </p>
        <div className={styles.pencilInk}>
          <div className={styles.field}>
            <p className={`text-overline ${styles.muted}`}>Pencil · suggested</p>
            <div className={styles.fieldRow}>
              <span className="text-small">Category</span>
              <Chip state="suggested">How-to</Chip>
            </div>
            <div className={styles.fieldRow}>
              <span className="text-small">Urgency</span>
              <Chip state="suggested">Normal</Chip>
            </div>
            <p className={`text-small ${styles.muted}`}>Suggested by the model, not yet reviewed</p>
          </div>
          <div className={styles.field}>
            <p className={`text-overline ${styles.muted}`}>Ink · decided</p>
            <div className={styles.fieldRow}>
              <span className="text-small">Category</span>
              <Chip state="decided" decidedBy="you">
                How-to
              </Chip>
            </div>
            <div className={styles.fieldRow}>
              <span className="text-small">Urgency</span>
              <Chip state="decided" decidedBy="you">
                High
              </Chip>
            </div>
            <p className={`text-small ${styles.muted}`}>
              AI suggested How-to · <span className="text-mono-small">64%</span> and Normal ·{" "}
              <span className="text-mono-small">70%</span>; set by you at{" "}
              <span className="text-mono-small">16:52</span>
            </p>
          </div>
        </div>
        <div className={styles.pencilInk}>
          <DraftEditor
            label="Draft reply"
            state="suggested"
            rows={2}
            note="Drafted by the model"
            defaultValue={draftText}
          />
          <DraftEditor
            label="Reply"
            state="approved"
            rows={2}
            note="Drafted by the model, approved by you at 16:55"
            defaultValue={draftText}
          />
        </div>
        <p className={`text-small ${styles.muted}`}>
          The suggestion fill is not a contrast boundary: against the card it measures 1.14:1 in
          light and 1.18:1 in dark, so a suggested chip or draft is told from a decided one by the
          decided style&apos;s solid border and its words, not by the fill&apos;s edge.
        </p>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Evidence</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          Quotes the model used, marked in the email with a fill and a dashed underline, since the
          model made the mark. Category evidence is the model&apos;s gray; urgency evidence is red,
          like severity. In the triage panel, the evidence list beside the email names which is
          which, so color isn&apos;t the only cue. These marks are an illustration, not a
          recorded model output.
        </p>
        <div className={styles.legend}>
          <span className="text-small">
            <EvidenceMark supports="category">Category</EvidenceMark>
          </span>
          <span className="text-small">
            <EvidenceMark supports="urgency">Urgency</EvidenceMark>
          </span>
        </div>
        <EmailBody body={excerpt} evidence={evidence} />
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Confidence</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          Confidence is the AI&apos;s estimate, not a measured probability. The color says whether
          the field needs a person before Approve, not how high the figure is. Amber: it blocks
          Approve, because it&apos;s under 60% or a close call within 15 points of its runner-up
          (then the word reads Close call). Petrol: it doesn&apos;t block. No fill, no hint text.
        </p>
        <div className={styles.stack}>
          <ConfidenceMeter value={0.92} />
          <ConfidenceMeter value={0.71} />
          <ConfidenceMeter value={0.71} runnerUp={0.64} runnerUpLabel="Cancellation risk" />
          <ConfidenceMeter value={0.48} />
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Severity</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          Only urgent is solid. The bars repeat the level without color.
        </p>
        <div className={styles.severities}>
          {(["urgent", "high", "normal", "low"] as const).map((level) => (
            <Severity key={level} level={level} />
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Contrast</h3>
        <ContrastTable pairs={pairs} theme={theme} />
      </section>
    </>
  );
}

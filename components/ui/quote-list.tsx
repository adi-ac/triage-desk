import type { EmailEvidence } from "@/lib/suggestion";
import { EvidenceMark } from "./evidence-mark";
import styles from "./quote-list.module.css";

export type QuoteListProps = {
  /** Quotes already matched to the email (matchEvidence). */
  evidence: readonly EmailEvidence[];
  /** A quote is hovered or focused (null when it isn't), so the screen can mark it in the email. */
  onEvidenceActive?: (quote: string | null) => void;
};

/**
 * The "Evidence" list under a suggestion: each quote marked as it is in the
 * email. With onEvidenceActive, quotes respond to hover and keyboard focus.
 * Used inside FieldReview and NoActionReview.
 */
export function QuoteList({ evidence, onEvidenceActive }: QuoteListProps) {
  if (evidence.length === 0) return null;
  return (
    <div className={styles.evidence}>
      <p className={`text-overline ${styles.label}`}>Evidence</p>
      <ul className={styles.quotes}>
        {evidence.map((e) => (
          <li
            key={`${e.supports}:${e.quote}`}
            tabIndex={onEvidenceActive ? 0 : undefined}
            className={`text-reading ${styles.quote}`}
            onMouseEnter={() => onEvidenceActive?.(e.quote)}
            onMouseLeave={() => onEvidenceActive?.(null)}
            onFocus={() => onEvidenceActive?.(e.quote)}
            onBlur={() => onEvidenceActive?.(null)}
          >
            <q>
              <EvidenceMark supports={e.supports}>{e.quote}</EvidenceMark>
            </q>
          </li>
        ))}
      </ul>
    </div>
  );
}

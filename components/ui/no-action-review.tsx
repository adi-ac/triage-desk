"use client";

import { useId } from "react";
import type { EmailEvidence, NotARequestReason } from "@/lib/suggestion";
import { Button } from "./button";
import { Chip } from "./chip";
import { QuoteList } from "./quote-list";
import styles from "./no-action-review.module.css";

const reasonWords: Record<NotARequestReason, string> = {
  "auto-reply": "Auto-reply",
  empty: "Empty",
  misdirected: "Misdirected",
  "nothing to do": "Nothing to do",
};

export type NoActionReviewProps = {
  reason: NotARequestReason;
  /** Claude's one-sentence explanation. */
  explanation: string;
  evidence?: readonly EmailEvidence[];
  onEvidenceActive?: (quote: string | null) => void;
  /** A person kept the suggestion and closed the ticket without a reply. */
  closed: boolean;
  /** Keep: close the ticket without a reply. */
  onKeep: () => void;
  /** Ask Claude for a normal suggestion instead. Leave out when none is available. */
  onTriageAnyway?: () => void;
};

/**
 * Claude's suggestion that an email isn't a request (an auto-reply, an
 * empty message, one sent to the wrong place, or nothing to do). It's still
 * a suggestion: pencil until a person acts. Keep closes the ticket without a
 * reply; "Triage anyway" asks Claude for a normal suggestion. Small
 * secondary buttons, like FieldReview's. Put it in a Pane; its heading is an h3.
 */
export function NoActionReview({ reason, explanation, evidence = [], onEvidenceActive, closed, onKeep, onTriageAnyway }: NoActionReviewProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className={styles.review}>
      <h3 id={headingId} className={`text-overline ${styles.label}`}>
        Request
      </h3>
      <div className={styles.row}>
        {closed ? (
          <Chip state="decided" decidedBy="you">
            Not a request
          </Chip>
        ) : (
          <Chip state="suggested">Not a request</Chip>
        )}
        <span className={`text-small ${styles.reason}`}>{reasonWords[reason]}</span>
      </div>
      <p className={`text-small ${styles.explanation}`}>{explanation}</p>
      {!closed && (
        <>
          <div className={styles.controls}>
            <Button size="small" onClick={onKeep}>
              Keep
            </Button>
            {onTriageAnyway && (
              <Button size="small" onClick={onTriageAnyway}>
                Triage anyway
              </Button>
            )}
          </div>
          <p className={`text-small ${styles.hint}`}>Keep closes the ticket without a reply.</p>
        </>
      )}
      <QuoteList evidence={evidence} onEvidenceActive={onEvidenceActive} />
    </section>
  );
}

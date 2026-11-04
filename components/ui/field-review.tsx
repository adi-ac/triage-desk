"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toPercent } from "@/lib/confidence";
import type { EmailEvidence, SuggestedField } from "@/lib/suggestion";
import { Button } from "./button";
import { Chip } from "./chip";
import { ConfidenceMeter } from "./confidence-meter";
import { EvidenceMark } from "./evidence-mark";
import styles from "./field-review.module.css";

export type FieldReviewProps<T extends string> = {
  /** Lets ApproveBar jump here: pass it in ApproveBar's targets. */
  id?: string;
  /** The field's name, shown as its heading: "Category". */
  label: string;
  /** The model's pick, its confidence and the runner-up. */
  field: SuggestedField<T>;
  /** Every value the field can take, for "Other…". */
  options: readonly T[];
  /** What a person kept or switched to; null while it's still the model's suggestion. */
  value: T | null;
  onValueChange: (value: T) => void;
  /** The ticket is approved: the field locks, and an untouched one reads "Approved as suggested". */
  approved?: boolean;
  /** Who decides, for the decided chip. */
  decidedBy?: string;
  /**
   * Sent by a team rule: nobody decided, so the chip stays pencil (no
   * decision styling), the meter stays, and there are no controls.
   */
  readOnly?: boolean;
  /**
   * Show "Confidence is Claude's estimate, not a measured probability." under
   * this field's meter. Once per triage pane: pass it to the first field that
   * still shows a meter. Nothing shows while the meter is replaced by a note.
   */
  explainEstimate?: boolean;
  /** This field's evidence, already matched to the email (matchEvidence), shown beneath it. */
  evidence?: readonly EmailEvidence[];
  /** A quote is hovered or focused (null when it isn't), so the screen can mark it in the email. */
  onEvidenceActive?: (quote: string | null) => void;
};

/**
 * Reviewing one suggested field. While suggested: the dashed chip, its
 * confidence, and small secondary "Keep", "Switch to <runner-up>" and
 * "Other…" (the full list), so the override is one click and never competes
 * with Approve. Once kept or switched: the solid chip and a quiet "Change"
 * link that reopens the controls, and the meter gives way to a note of what
 * Claude suggested, since a meter beside a value must never show confidence
 * in a different value. Put it in a Pane; its heading is an h3.
 */
export function FieldReview<T extends string>({
  id,
  label,
  field,
  options,
  value,
  onValueChange,
  approved = false,
  decidedBy = "you",
  readOnly = false,
  explainEstimate = false,
  evidence = [],
  onEvidenceActive,
}: FieldReviewProps<T>) {
  const headingId = useId();
  const listId = useId();
  const [reopened, setReopened] = useState(false);
  const [otherOpen, setOtherOpen] = useState(false);
  const changeRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const pendingFocus = useRef<"change" | "keep" | null>(null);

  // After a choice the controls go away, so focus moves to "Change"; after
  // "Change", it moves to "Keep". Otherwise keyboard focus would be lost.
  useEffect(() => {
    if (pendingFocus.current === "change") changeRef.current?.focus();
    if (pendingFocus.current === "keep") keepRef.current?.focus();
    pendingFocus.current = null;
  });

  const decided = value !== null;
  const shown = value ?? field.value;
  const alternative = shown === field.value ? field.runnerUp?.value : field.value;
  const showControls = !approved && !readOnly && (!decided || reopened);
  const others = options.filter((o) => o !== shown && o !== alternative);

  function choose(next: T) {
    setReopened(false);
    setOtherOpen(false);
    pendingFocus.current = "change";
    if (next !== value) onValueChange(next);
  }

  function reopen() {
    setReopened(true);
    pendingFocus.current = "keep";
  }

  return (
    <section id={id} tabIndex={id ? -1 : undefined} aria-labelledby={headingId} className={styles.field}>
      <h3 id={headingId} className={`text-overline ${styles.label}`}>
        {label}
      </h3>

      <div className={styles.row}>
        {decided ? (
          <Chip state="decided" decidedBy={decidedBy} aiPick={value === field.value}>
            {value}
          </Chip>
        ) : approved ? (
          <Chip state="decided" asSuggested>
            {field.value}
          </Chip>
        ) : (
          <Chip state="suggested">{field.value}</Chip>
        )}
        {decided && !approved && !readOnly && !reopened && (
          <button
            ref={changeRef}
            type="button"
            className={`text-small ${styles.change}`}
            aria-label={`Change ${label.toLowerCase()}`}
            onClick={reopen}
          >
            Change
          </button>
        )}
      </div>

      {decided ? (
        <p className={`text-small ${styles.note}`}>
          Claude suggested {field.value} · <span className="text-mono">{toPercent(field.confidence)}%</span>
        </p>
      ) : (
        <>
          <ConfidenceMeter value={field.confidence} runnerUp={field.runnerUp?.confidence} confirmed={approved || readOnly} />
          {explainEstimate && (
            <p className={`text-small ${styles.note}`}>Confidence is Claude&apos;s estimate, not a measured probability.</p>
          )}
        </>
      )}

      {showControls && (
        <div className={styles.controls}>
          <Button ref={keepRef} size="small" onClick={() => choose(shown)}>
            Keep
          </Button>
          {alternative && (
            <Button size="small" onClick={() => choose(alternative)}>
              Switch to {alternative}
            </Button>
          )}
          {others.length > 0 && (
            <Button size="small" aria-expanded={otherOpen} aria-controls={listId} onClick={() => setOtherOpen((o) => !o)}>
              Other…
            </Button>
          )}
        </div>
      )}

      {showControls && otherOpen && (
        <ul id={listId} className={styles.options} aria-label={`Other ${label.toLowerCase()} options`}>
          {others.map((option) => (
            <li key={option}>
              <Button size="small" onClick={() => choose(option)}>
                {option}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {evidence.length > 0 && (
        <div className={styles.evidence}>
          <p className={`text-overline ${styles.label}`}>Evidence</p>
          <ul className={styles.quotes}>
            {evidence.map((e) => (
              <li
                key={e.quote}
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
      )}
    </section>
  );
}

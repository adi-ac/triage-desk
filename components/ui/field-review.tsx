"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SuggestedField } from "@/lib/suggestion";
import { Button } from "./button";
import { Chip } from "./chip";
import { ConfidenceMeter } from "./confidence-meter";
import styles from "./field-review.module.css";

export type FieldReviewProps<T extends string> = {
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
};

/**
 * Reviewing one suggested field. While suggested: the dashed chip, its
 * confidence, and small secondary "Keep", "Switch to <runner-up>" and
 * "Other…" (the full list), so the override is one click and never competes
 * with Approve. Once decided: the solid chip and a quiet "Change" link that
 * reopens the controls. Put it in a Pane; its heading is an h3.
 */
export function FieldReview<T extends string>({
  label,
  field,
  options,
  value,
  onValueChange,
  approved = false,
  decidedBy = "you",
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
  const showControls = !approved && (!decided || reopened);
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
    <section aria-labelledby={headingId} className={styles.field}>
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
        {decided && !approved && !reopened && (
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

      <ConfidenceMeter value={field.confidence} runnerUp={field.runnerUp?.confidence} confirmed={decided || approved} />

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
    </section>
  );
}

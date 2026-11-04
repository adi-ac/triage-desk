"use client";

import { useId, useRef, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import styles from "./draft-editor.module.css";

/**
 * suggested: the model's draft, untouched. Pencil: dashed.
 * edited: a person has changed it. Solid control border.
 * approved: approved or sent by a person. Read-only, in the decided (ink) style.
 * sent-by-rule: sent by a team rule, nobody reviewed it. Read-only and still pencil.
 */
export type DraftState = "suggested" | "edited" | "approved" | "sent-by-rule";

const words: Record<DraftState, string> = {
  suggested: "Suggested",
  edited: "Edited",
  approved: "Approved",
  "sent-by-rule": "Sent by rule",
};

/** Splits text so each [placeholder] can be highlighted behind the textarea. */
const placeholderPattern = /(\[[^\]\n]+\])/g;

export type DraftEditorProps = Omit<ComponentProps<"textarea">, "className" | "style" | "readOnly"> & {
  label: string;
  /**
   * Where the draft stands. A suggested draft shows as edited from the first
   * change a person makes, and onStateChange("edited") fires; give each new
   * draft its own key so it starts suggested again.
   */
  state: DraftState;
  onStateChange?: (state: DraftState) => void;
  /** Who drafted it, e.g. "Drafted by the model". Keep it in every state. */
  note?: ReactNode;
  /**
   * Something to check that doesn't block Approve, such as a draft written
   * for a value a person has since overridden.
   */
  warning?: string;
  /**
   * What blocks Approve here, from approveBlockers() (target "draft"), shown
   * where it's fixed. Unfilled [placeholders] are highlighted in the text either way.
   */
  blocker?: string;
};

/** A reply draft. Controlled with value/onChange, or uncontrolled with defaultValue. */
export function DraftEditor({
  label,
  state,
  onStateChange,
  note,
  warning,
  blocker,
  id,
  rows = 6,
  onChange,
  ...props
}: DraftEditorProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const noteId = `${fieldId}-note`;
  const warningId = `${fieldId}-warning`;
  const blockerId = `${fieldId}-blocker`;
  const describedBy = [blocker && blockerId, warning && warningId, note && noteId].filter(Boolean).join(" ") || undefined;
  const [changed, setChanged] = useState(false);
  const [uncontrolledText, setUncontrolledText] = useState(String(props.defaultValue ?? ""));
  const text = props.value !== undefined ? String(props.value) : uncontrolledText;
  const backdrop = useRef<HTMLDivElement>(null);
  const shown: DraftState = state === "suggested" && changed ? "edited" : state;
  const readOnly = shown === "approved" || shown === "sent-by-rule";

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (state === "suggested" && !changed) {
      setChanged(true);
      onStateChange?.("edited");
    }
    if (props.value === undefined) setUncontrolledText(event.target.value);
    onChange?.(event);
  }

  return (
    <div className={styles.field} data-state={shown}>
      <label htmlFor={fieldId} className={`text-overline ${styles.label}`}>
        {label} <span className={styles.state}>· {words[shown]}</span>
      </label>
      <div className={styles.box}>
        {/* Draws the placeholder highlights behind the textarea's transparent background. */}
        <div ref={backdrop} className={`text-reading ${styles.backdrop}`} aria-hidden>
          {text.split(placeholderPattern).map((part, i) =>
            i % 2 === 1 ? (
              <mark key={i} className={styles.placeholder}>
                {part}
              </mark>
            ) : (
              part
            ),
          )}
          {"\n"}
        </div>
        <textarea
          id={fieldId}
          rows={rows}
          aria-describedby={describedBy}
          spellCheck
          {...props}
          readOnly={readOnly}
          onChange={handleChange}
          onScroll={(e) => {
            if (backdrop.current) backdrop.current.scrollTop = e.currentTarget.scrollTop;
          }}
          className={`text-reading ${styles.textarea}`}
        />
      </div>
      {blocker && (
        <p id={blockerId} className={`text-small ${styles.warning}`}>
          {blocker}
        </p>
      )}
      {warning && (
        <p id={warningId} className={`text-small ${styles.warning}`}>
          {warning}
        </p>
      )}
      {note && (
        <p id={noteId} className={`text-small ${styles.note}`}>
          {note}
        </p>
      )}
    </div>
  );
}

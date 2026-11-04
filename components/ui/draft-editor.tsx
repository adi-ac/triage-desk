"use client";

import { useId, useState, type ChangeEvent, type ComponentProps, type ReactNode } from "react";
import styles from "./draft-editor.module.css";

/**
 * suggested: the model's draft, untouched. Pencil: dashed.
 * edited: a person has changed it. Solid control border.
 * approved: sent or locked. Read-only, in the decided (ink) style.
 */
export type DraftState = "suggested" | "edited" | "approved";

const words: Record<DraftState, string> = { suggested: "Suggested", edited: "Edited", approved: "Approved" };

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
};

/** A reply draft. Controlled with value/onChange, or uncontrolled with defaultValue. */
export function DraftEditor({ label, state, onStateChange, note, warning, id, rows = 6, onChange, ...props }: DraftEditorProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const noteId = `${fieldId}-note`;
  const warningId = `${fieldId}-warning`;
  const describedBy = [note && noteId, warning && warningId].filter(Boolean).join(" ") || undefined;
  const [changed, setChanged] = useState(false);
  const shown: DraftState = state === "suggested" && changed ? "edited" : state;

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    if (state === "suggested" && !changed) {
      setChanged(true);
      onStateChange?.("edited");
    }
    onChange?.(event);
  }

  return (
    <div className={styles.field} data-state={shown}>
      <label htmlFor={fieldId} className={`text-overline ${styles.label}`}>
        {label} <span className={styles.state}>· {words[shown]}</span>
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        aria-describedby={describedBy}
        spellCheck
        {...props}
        readOnly={shown === "approved"}
        onChange={handleChange}
        className={`text-reading ${styles.textarea}`}
      />
      {note && (
        <p id={noteId} className={`text-small ${styles.note}`}>
          {note}
        </p>
      )}
      {warning && (
        <p id={warningId} className={`text-small ${styles.warning}`}>
          {warning}
        </p>
      )}
    </div>
  );
}

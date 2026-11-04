"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./draft-editor.module.css";

export type DraftEditorProps = Omit<ComponentProps<"textarea">, "className" | "style"> & {
  label: string;
  /** Help under the field, e.g. who drafted it. */
  note?: ReactNode;
};

/** A reply draft. Controlled with value/onChange, or uncontrolled with defaultValue. */
export function DraftEditor({ label, note, id, rows = 6, ...props }: DraftEditorProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const noteId = `${fieldId}-note`;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={`text-overline ${styles.label}`}>
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        aria-describedby={note ? noteId : undefined}
        spellCheck
        {...props}
        className={`text-reading ${styles.textarea}`}
      />
      {note && (
        <p id={noteId} className={`text-small ${styles.note}`}>
          {note}
        </p>
      )}
    </div>
  );
}

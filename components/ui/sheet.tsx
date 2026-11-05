"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "./icon-button";
import styles from "./sheet.module.css";

export type SheetProps = {
  open: boolean;
  /** Called on Escape, a click on the scrim, or the round × button ("Close <title>"). */
  onClose: () => void;
  /** The sheet's name, shown as its heading. */
  title: string;
  children: ReactNode;
};

/**
 * A dialog-level panel from the left edge: surface-raised, the dialog shadow
 * and the scrim; full width on phones. Focus moves into it on open and back
 * to whatever opened it on close (native <dialog>). It closes on Escape and
 * on a click outside; the screen closes it when a choice is made inside.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={headingId}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog itself, outside its panel, is a click on the scrim.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 id={headingId} className={`text-heading ${styles.title}`}>
            {title}
          </h2>
          <IconButton icon="close" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </dialog>
  );
}

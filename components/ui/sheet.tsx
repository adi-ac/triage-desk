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
 * A dialog-level panel from the right edge (380px, full width on phones): surface-raised, the dialog shadow
 * and the scrim; full width on phones. On open, focus moves to the sheet
 * itself (not its close button), so a tap shows no focus ring; Tab then
 * reaches the close button with its usual ring. On close, focus goes back
 * to whatever opened it (native <dialog>), and the browser shows the ring
 * only after keyboard use (Escape, Tab). It closes on Escape and on a click
 * outside; the screen closes it when a choice is made inside.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal focuses the first control (the close button); start on the
      // sheet itself instead, so no ring appears after a tap.
      dialog.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      tabIndex={-1}
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

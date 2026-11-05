"use client";

import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { IconButton } from "./icon-button";
import styles from "./sheet.module.css";

export type SheetProps = {
  open: boolean;
  /** Called on Escape, a click on the scrim, the close button, or a swipe down (phones). */
  onClose: () => void;
  /** The sheet's name, shown as its heading. */
  title: string;
  children: ReactNode;
};

/** A swipe closes past this distance (px, or a quarter of the sheet if less)... */
const closeDistance = 160;
/** ...or when released moving down faster than this (px per ms). */
const closeVelocity = 0.5;

const isPhone = () => matchMedia("(max-width: 767px)").matches;

/**
 * A dialog-level panel: on phones a bottom sheet (90dvh, rounded top
 * corners, a grab handle, swipe down to dismiss), on tablets 380px from the
 * right edge. It slides in from its edge (sheet.module.css). On open, focus
 * moves to the sheet itself (not its close button), so a tap shows no
 * focus ring; Tab then reaches the close button with its usual ring. On
 * close, focus goes back to whatever opened it (native <dialog>), and the
 * browser shows the ring only after keyboard use. It closes on Escape, a
 * click outside, the close button, or a swipe down; the screen closes it
 * when a choice is made inside.
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const drag = useRef<{ id: number; startY: number; lastY: number; lastT: number; velocity: number; height: number } | null>(null);

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

  // Swipe down on the handle or header (phones): the sheet follows the
  // finger, closes past the distance or velocity threshold, and otherwise
  // springs back.
  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const dialog = ref.current;
    if (!dialog || !isPhone() || e.button !== 0) return;
    // The close button is a button, not a place to start a drag.
    if ((e.target as Element).closest("button")) return;
    drag.current = {
      id: e.pointerId,
      startY: e.clientY,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      height: dialog.getBoundingClientRect().height,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer is already gone (a very quick tap); nothing to follow.
    }
    dialog.dataset.dragging = "";
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const dialog = ref.current;
    if (!d || !dialog || e.pointerId !== d.id) return;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.velocity = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    dialog.style.transform = `translateY(${Math.max(0, e.clientY - d.startY)}px)`;
  }

  function endDrag(e: PointerEvent<HTMLDivElement>, cancelled: boolean) {
    const d = drag.current;
    const dialog = ref.current;
    if (!d || !dialog || e.pointerId !== d.id) return;
    drag.current = null;
    const distance = Math.max(0, e.clientY - d.startY);
    const dismiss =
      !cancelled && (distance > Math.min(closeDistance, d.height / 4) || (d.velocity > closeVelocity && distance > 8));
    delete dialog.dataset.dragging;
    // Close (or not) and clear the finger's offset in the same task, so the
    // transition runs from where the finger left it: down and out, or back up.
    if (dismiss) dialog.close();
    dialog.style.transform = "";
  }

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
        <div
          className={styles.dragArea}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
        >
          <div className={styles.handle} aria-hidden />
          <div className={styles.header}>
            <h2 id={headingId} className={`text-heading ${styles.title}`}>
              {title}
            </h2>
            <IconButton icon="close" aria-label={`Close ${title.toLowerCase()}`} onClick={onClose} />
          </div>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </dialog>
  );
}

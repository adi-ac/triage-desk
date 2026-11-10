"use client";

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { fieldsEmpty, initialFocus, moveFocus, ms, reducedMotion, token, useLastInputWasPointer } from "./focus";
import { IconButton } from "./icon-button";
import styles from "./dialog.module.css";

export type DialogProps = {
  open: boolean;
  /** Called with false on the ×, and on Escape or a scrim click when every field is empty. */
  onOpenChange: (open: boolean) => void;
  /** Its heading and name ("New ticket"). */
  title: string;
  /** Called once it has fully closed (after its exit): e.g. to clear a form inside it. */
  onClosed?: () => void;
  children: ReactNode;
};

/**
 * A modal dialog (DESIGN.md, Dialog): a native <dialog> opened with
 * showModal(), so the page is inert and focus stays inside it. 560px wide
 * (at most the viewport minus 48px), centered over the scrim, with a
 * header (the title and a ×) and the content below.
 *
 * Focus goes to the content's [data-autofocus] element (its first field)
 * on open, or, on touch devices, to the heading, so no keyboard pops up;
 * and back to whatever opened it on close. The × always closes it; Escape
 * and a click on the scrim close it only when every field in it is empty,
 * so a stray key or click never loses typed or pasted text.
 *
 * Its entrance and exit run with the Web Animations API (an exit has to:
 * Safari can't animate a top-layer exit in CSS), each from wherever the
 * other had reached, and close() is called only once the exit finishes.
 */
export function Dialog({ open, onOpenChange, title, onClosed, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pointer = useLastInputWasPointer();
  // What had focus before it opened, to return focus to on close.
  const returnTo = useRef<HTMLElement | null>(null);
  // The running entrance or exit.
  const motion = useRef<Animation[]>([]);
  // Where the last press started, so a drag that ends on the scrim (say,
  // selecting text in a field) isn't a click on it.
  const press = useRef<{ x: number; y: number; outside: boolean } | null>(null);
  const latest = useRef({ onOpenChange, onClosed });
  useLayoutEffect(() => {
    latest.current = { onOpenChange, onClosed };
  });
  // Set when this component closes the <dialog>, until its close event
  // (which fires a task later), to tell its own close from the browser's.
  const closing = useRef(false);

  // Closed (after the exit, or at once): focus back where it was, then
  // tell the screen.
  const settle = useRef<() => void>(null);
  useLayoutEffect(() => {
    settle.current = () => {
      motion.current.forEach((a) => a.cancel());
      motion.current = [];
      const back = returnTo.current;
      returnTo.current = null;
      if (back?.isConnected) moveFocus(back, pointer.current);
      latest.current.onClosed?.();
    };
  }, [pointer]);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    const finish = () => {
      if (dialog.open) {
        closing.current = true;
        dialog.close();
      }
      settle.current?.();
    };

    if (open) {
      if (!dialog.open) {
        returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
        if (headingRef.current) moveFocus(initialFocus(dialog, headingRef.current), pointer.current);
        if (!reducedMotion()) motion.current = animate(dialog, "in", motion.current);
      } else if (motion.current.length) {
        // Reopened during the exit: run back in from where it is.
        motion.current = animate(dialog, "in", motion.current);
      }
      return;
    }

    if (!dialog.open) return;
    if (reducedMotion()) {
      finish();
      return;
    }
    const exit = animate(dialog, "out", motion.current);
    motion.current = exit;
    Promise.allSettled(exit.map((a) => a.finished)).then(() => {
      // Not if it was reopened (or closed again) in the meantime.
      if (motion.current === exit && exit.every((a) => a.playState === "finished")) finish();
    });
  }, [open, pointer]);

  // Escape follows the scrim's rule: it closes only when every field is
  // empty, so typed or pasted text is never lost to a stray key. Handled
  // on keydown, which stops the browser's own close request before it
  // starts (a cancel event can't be cancelled twice in a row without a
  // click in between, so a second Escape would close it anyway).
  // Closed through onOpenChange, so the exit plays. If the browser closes
  // it anyway (Android's back gesture), settle the state.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.isComposing) return;
      e.preventDefault();
      if (fieldsEmpty(dialog)) latest.current.onOpenChange(false);
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      if (fieldsEmpty(dialog)) latest.current.onOpenChange(false);
    };
    const onClose = () => {
      if (closing.current) {
        closing.current = false;
        return;
      }
      settle.current?.();
      latest.current.onOpenChange(false);
    };
    dialog.addEventListener("keydown", onKeyDown);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("keydown", onKeyDown);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("close", onClose);
    };
  }, []);

  const outside = (dialog: HTMLElement, x: number, y: number) => {
    const r = dialog.getBoundingClientRect();
    return x < r.left || x > r.right || y < r.top || y > r.bottom;
  };

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={headingId}
      onPointerDown={(e) => {
        press.current = { x: e.clientX, y: e.clientY, outside: outside(e.currentTarget, e.clientX, e.clientY) };
      }}
      onClick={(e) => {
        // A click on the scrim lands on the <dialog> itself, outside its box.
        const dialog = e.currentTarget;
        if (e.target !== dialog || !press.current?.outside || !outside(dialog, e.clientX, e.clientY)) return;
        if (fieldsEmpty(dialog)) onOpenChange(false);
      }}
    >
      <div className={styles.header}>
        <h2 ref={headingRef} id={headingId} tabIndex={-1} className={`text-heading ${styles.title}`}>
          {title}
        </h2>
        <IconButton icon="close" size="small" aria-label="Close" onClick={() => onOpenChange(false)} />
      </div>
      {children}
    </dialog>
  );
}

/**
 * The entrance (opacity and scale up, the scrim fading in) or the exit
 * (the same way back, faster), each starting from the current values, so
 * one that interrupts the other picks up where it was. The exit holds its
 * end state until the dialog closes.
 */
function animate(dialog: HTMLDialogElement, to: "in" | "out", running: Animation[]) {
  const box = getComputedStyle(dialog);
  const backdrop = getComputedStyle(dialog, "::backdrop");
  const fromScale = running.length ? box.scale : token("--scale-dialog-from");
  const from = {
    opacity: running.length ? box.opacity : "0",
    scale: fromScale === "none" ? "1" : fromScale,
    scrim: running.length ? backdrop.opacity : "0",
  };
  running.forEach((a) => a.cancel());
  const target = to === "in" ? { opacity: "1", scale: "1" } : { opacity: "0", scale: token("--scale-dialog-from") };
  const options: KeyframeAnimationOptions = {
    duration: ms(to === "in" ? "--duration-dialog-in" : "--duration-dialog-out"),
    easing: token("--ease-enter"),
    fill: to === "out" ? "forwards" : "none",
  };
  return [
    dialog.animate(
      [
        { opacity: from.opacity, scale: from.scale },
        { opacity: target.opacity, scale: target.scale },
      ],
      options,
    ),
    dialog.animate([{ opacity: from.scrim }, { opacity: target.opacity }], { ...options, pseudoElement: "::backdrop" }),
  ];
}

"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./fab-panel.module.css";

export type FabPanelProps = {
  open: boolean;
  /** Called with false on the button, a scrim tap or Escape; the screen also closes it when a choice is made inside. */
  onOpenChange: (open: boolean) => void;
  /** One word: the panel's heading and name, the button's label when extended, and its aria-label ("Open queue" / "Close queue"). */
  title: string;
  icon: IconName;
  /** The panel's content. It scrolls on its own. */
  children: ReactNode;
  /** Called after the panel opens, with its scrolling element, e.g. to bring the current item into view. */
  onOpened?: (scroller: HTMLDivElement) => void;
};

const subscribeScroll = (onChange: () => void) => {
  addEventListener("scroll", onChange, { passive: true });
  return () => removeEventListener("scroll", onChange);
};
const atTopSnapshot = () => window.scrollY <= 0;

/**
 * A floating action button, fixed at the bottom right, and the panel it
 * opens above itself (DESIGN.md, FabPanel). There's one button: it stays
 * interactive and on top while the panel is open, and becomes the close
 * control. The scrim, the panel and the button are popovers in the top
 * layer, shown in that order (the button re-shown last, so it stays on
 * top), not a modal <dialog>: a modal would make the button inert. It's
 * managed like a dialog instead: role="dialog", focus into the panel on
 * open and back to the button on close, Escape and a scrim tap close it,
 * everything else on the page is inert and page scroll is locked.
 *
 * The button shows its label only when the page is scrolled to the very
 * top and the panel is closed; how it extends, collapses and morphs is in
 * fab-panel.module.css.
 */
export function FabPanel({ open, onOpenChange, title, icon, children, onOpened }: FabPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const name = title.toLowerCase();

  // At the top on the server and during hydration, so the button is
  // extended in the HTML; collapsed from the first scroll down.
  const atTop = useSyncExternalStore(subscribeScroll, atTopSnapshot, () => true);
  const extended = atTop && !open;

  // No motion until after the first paint: a page that loads scrolled
  // collapses the button at once instead of animating it.
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMotion(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Whether the last input was a pointer (tap or click) or a key, so focus
  // moves without a ring after a tap even if the keyboard was used before.
  const pointerInput = useRef(false);
  useEffect(() => {
    const onPointer = () => (pointerInput.current = true);
    const onKey = () => (pointerInput.current = false);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  const opened = useRef(false);
  const callbacks = useRef({ onOpenChange, onOpened });
  useEffect(() => {
    callbacks.current = { onOpenChange, onOpened };
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scrim = scrimRef.current;
    const panel = panelRef.current;
    const fab = fabRef.current;
    if (!root || !scrim || !panel || !fab) return;

    if (!open) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      if (scrim.matches(":popover-open")) scrim.hidePopover();
      // Back to the button, unless it already has focus (it was the close).
      // The browser shows the ring only after keyboard use (Escape, Enter
      // on a ticket), not after a tap or click.
      if (opened.current && document.activeElement !== fab) moveFocus(fab, pointerInput.current);
      return;
    }

    opened.current = true;
    // Not shown yet, or still playing its exit (reopened mid-close).
    if (!scrim.matches(":popover-open")) scrim.showPopover();
    if (!panel.matches(":popover-open")) panel.showPopover();
    // The panel joined the top layer above the button; re-show the button
    // so it's on top again. It stays displayed throughout (its display is
    // set in CSS), so this never flickers or restarts its transitions.
    if (fab.matches(":popover-open")) fab.hidePopover();
    fab.showPopover();
    if (scrollerRef.current) callbacks.current.onOpened?.(scrollerRef.current);
    // Into the panel itself, not its first control, so a tap shows no ring.
    moveFocus(panel, pointerInput.current);

    const restoreInert = inertOthers(root);
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        callbacks.current.onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      restoreInert();
      html.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <div ref={scrimRef} popover="manual" className={styles.scrim} onClick={() => onOpenChange(false)} />
      <div
        ref={panelRef}
        id={panelId}
        popover="manual"
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className={styles.panel}
      >
        <div className={styles.header}>
          <h2 className={`text-heading ${styles.title}`}>{title}</h2>
        </div>
        <div ref={scrollerRef} className={styles.content}>
          {children}
        </div>
      </div>
      <button
        ref={fabRef}
        type="button"
        popover="manual"
        className={styles.fab}
        data-extended={extended ? "" : undefined}
        data-open={open ? "" : undefined}
        data-motion={motion ? "" : undefined}
        aria-label={open ? `Close ${name}` : `Open ${name}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        <span className={styles.icons} aria-hidden>
          <span className={styles.openIcon}>
            <Icon name={icon} size={20} />
          </span>
          <span className={styles.closeIcon}>
            <Icon name="close" size={20} />
          </span>
        </span>
        <span className={styles.labelClip} aria-hidden>
          <span className={styles.labelTrack}>
            <span className={styles.label}>{title}</span>
          </span>
        </span>
      </button>
    </div>
  );
}

/**
 * Focuses `el`, with a ring only after keyboard use. The browser's own
 * guess carries a ring over from the element losing focus, even after a
 * tap, so the component says which: no ring after a tap or click, the
 * usual ring after a key (Escape, Enter on an item).
 */
function moveFocus(el: HTMLElement, afterPointer: boolean) {
  // focusVisible isn't in TypeScript's DOM types yet; browsers without it
  // ignore it and fall back to their own guess.
  const options = { preventScroll: true, focusVisible: !afterPointer };
  el.focus(options);
}

/**
 * Makes everything outside `root` inert (the siblings of root and of each
 * of its ancestors, up to <body>), so Tab and screen readers stay in the
 * panel and the button, and returns a function that undoes it.
 */
function inertOthers(root: Element) {
  const changed: Element[] = [];
  for (let node: Element | null = root; node && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (sibling !== node && !sibling.hasAttribute("inert")) {
        sibling.setAttribute("inert", "");
        changed.push(sibling);
      }
    }
  }
  return () => changed.forEach((el) => el.removeAttribute("inert"));
}

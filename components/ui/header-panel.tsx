"use client";

import { useEffect, useId, useLayoutEffect, useRef, type ReactNode, type Ref, type RefObject } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./header-panel.module.css";

export type HeaderPanelProps = {
  open: boolean;
  /** Called with false on the button, a scrim tap or Escape; the screen also closes it when a choice is made inside. */
  onOpenChange: (open: boolean) => void;
  /** One word: the panel's heading and name ("Queue"). */
  title: string;
  /** The panel's id, for the HeaderPanelButton's `controls`. */
  id?: string;
  /** The HeaderPanelButton that opens it, in the AppHeader. */
  button: RefObject<HTMLButtonElement | null>;
  /** The panel's content. It scrolls on its own. */
  children: ReactNode;
  /** Called after the panel opens, with its scrolling element, e.g. to bring the current item into view. */
  onOpened?: (scroller: HTMLDivElement) => void;
};

/**
 * A panel that opens below the app header from a HeaderPanelButton in it
 * (DESIGN.md, HeaderPanel): the inbox's queue below 1200px. It's 8px below
 * the header and exactly as wide as the header row (which spans the panes),
 * down to 16px from the bottom of the viewport, over a scrim that covers
 * the whole viewport, header included.
 *
 * One button: the scrim, the panel and the button are popovers in the top
 * layer, shown in that order (the button re-shown last, so it's on top),
 * not a modal <dialog>, which would make the button inert. While open the
 * button is fixed exactly where it sits in the header (page scroll is
 * locked, so it can't move) and becomes the close; it leaves the top layer
 * once the panel's exit has finished, so the fading scrim never covers it.
 * It's managed like a dialog: role="dialog", focus into the panel on open
 * and back to the button on close, Escape and a scrim tap close it, and
 * everything except the button and the panel is inert.
 */
export function HeaderPanel({ open, onOpenChange, title, id, button, children, onOpened }: HeaderPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const ownId = useId();
  const panelId = id ?? ownId;

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
    const trigger = button.current;
    // The button's slot keeps its place in the header, so it's where the
    // button is, in or out of the top layer.
    const slot = trigger?.parentElement;
    if (!root || !scrim || !panel || !trigger || !slot) return;

    if (!open) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      if (scrim.matches(":popover-open")) scrim.hidePopover();
      // Back to the button, unless it already has focus (it was the close).
      // The browser shows the ring only after keyboard use (Escape, Enter
      // on a ticket), not after a tap or click.
      if (opened.current && document.activeElement !== trigger) moveFocus(trigger, pointerInput.current);
      // The button leaves the top layer once the scrim and panel have
      // closed (at once under reduced motion), not before.
      if (!trigger.matches(":popover-open")) return;
      let cancelled = false;
      const exits = [...panel.getAnimations(), ...scrim.getAnimations()].map((a) => a.finished);
      Promise.allSettled(exits).then(() => {
        if (cancelled) return;
        trigger.hidePopover();
        trigger.style.removeProperty("--button-top");
        trigger.style.removeProperty("--button-left");
      });
      return () => {
        cancelled = true;
      };
    }

    opened.current = true;
    // Place the panel under the header row, and pin the button where it
    // is, before either joins the top layer; again on resize.
    const place = () => {
      const header = slot.closest("header");
      if (header) {
        const h = header.getBoundingClientRect();
        panel.style.setProperty("--panel-top", `${h.bottom + 8}px`);
        panel.style.setProperty("--panel-left", `${h.left}px`);
        panel.style.setProperty("--panel-width", `${h.width}px`);
      }
      const b = slot.getBoundingClientRect();
      trigger.style.setProperty("--button-top", `${b.top}px`);
      trigger.style.setProperty("--button-left", `${b.left}px`);
    };
    place();
    // Not shown yet, or still playing its exit (reopened mid-close).
    if (!scrim.matches(":popover-open")) scrim.showPopover();
    if (!panel.matches(":popover-open")) panel.showPopover();
    // The panel joined the top layer above the button; re-show the button
    // so it's on top. Its display is set in CSS, so it never flickers.
    if (trigger.matches(":popover-open")) trigger.hidePopover();
    trigger.showPopover();
    if (scrollerRef.current) callbacks.current.onOpened?.(scrollerRef.current);
    // Into the panel itself, not its first control, so a tap shows no ring.
    moveFocus(panel, pointerInput.current);

    const restoreInert = inertOthers([root, trigger]);
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
    addEventListener("resize", place);
    return () => {
      restoreInert();
      html.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("resize", place);
    };
  }, [open, button]);

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
    </div>
  );
}

export type HeaderPanelButtonProps = {
  /** HeaderPanel's `button` ref. */
  ref: Ref<HTMLButtonElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The same title as the HeaderPanel: the aria-label is "Open <title>" / "Close <title>". */
  title: string;
  icon: IconName;
  /** The HeaderPanel's id. */
  controls: string;
};

/**
 * The trigger: a round 32px button in Approve's primary style with an 18px
 * icon, in the AppHeader's actions, inside a 32px slot that keeps its place
 * while the button is in the top layer. Rendered with the header, so it's
 * in the server HTML. On phones it has an invisible 44px touch target.
 */
export function HeaderPanelButton({ ref, open, onOpenChange, title, icon, controls }: HeaderPanelButtonProps) {
  const name = title.toLowerCase();
  return (
    <button
      ref={ref}
      type="button"
      popover="manual"
      className={styles.button}
      data-open={open ? "" : undefined}
      aria-label={open ? `Close ${name}` : `Open ${name}`}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={controls}
      onClick={() => onOpenChange(!open)}
    >
      <span className={styles.icons} aria-hidden>
        <span className={styles.openIcon}>
          <Icon name={icon} size={18} />
        </span>
        <span className={styles.closeIcon}>
          <Icon name="close" size={18} />
        </span>
      </span>
    </button>
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
 * Makes everything outside `keep` inert (the siblings of each kept element
 * and of each of its ancestors, up to <body>), so Tab and screen readers
 * stay in the panel and its button, and returns a function that undoes it.
 */
function inertOthers(keep: Element[]) {
  const spared = new Set<Element>();
  for (const el of keep) for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) spared.add(n);
  const changed: Element[] = [];
  for (const node of spared) {
    for (const sibling of node.parentElement?.children ?? []) {
      if (!spared.has(sibling) && !sibling.hasAttribute("inert")) {
        sibling.setAttribute("inert", "");
        changed.push(sibling);
      }
    }
  }
  return () => changed.forEach((el) => el.removeAttribute("inert"));
}

"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
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
  /** The panel's id, for a FabPanelHeaderButton's `controls`. */
  id?: string;
  /**
   * Tablets (768px and up): a FabPanelHeaderButton in the AppHeader, to the
   * right of the theme toggle. It's the trigger instead of the FAB, and the
   * panel opens 8px below that header, as wide as it. Leave it out and the
   * FAB is the trigger at every width.
   */
  navButton?: RefObject<HTMLButtonElement | null>;
};

const tabletQuery = "(min-width: 768px)";

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
 *
 * With navButton, tablets get a header button instead (the inbox): the same
 * one-button rule. It sits in the header until the panel opens; then it's
 * shown in the top layer above the scrim and panel, fixed where it was
 * (page scroll is locked, so it can't move), and becomes the close. It
 * leaves the top layer only once the panel's exit has finished, so the
 * fading scrim never covers it.
 */
export function FabPanel({ open, onOpenChange, title, icon, children, onOpened, id, navButton }: FabPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const ownId = useId();
  const panelId = id ?? ownId;
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
    const nav = navButton?.current ?? null;
    // The header button's slot keeps its 32px place in the header, so it's
    // where the button is, in or out of the top layer.
    const navSlot = nav?.parentElement;
    const tablet = () => nav !== null && matchMedia(tabletQuery).matches;

    if (!open) {
      if (panel.matches(":popover-open")) panel.hidePopover();
      if (scrim.matches(":popover-open")) scrim.hidePopover();
      // Back to the button that's showing, unless it already has focus (it
      // was the close). The browser shows the ring only after keyboard use
      // (Escape, Enter on a ticket), not after a tap or click.
      const trigger = tablet() ? nav! : fab;
      if (opened.current && document.activeElement !== trigger) moveFocus(trigger, pointerInput.current);
      // The header button leaves the top layer once the scrim and panel
      // have faded out (at once under reduced motion), not before, so the
      // fading scrim never covers it.
      if (!nav?.matches(":popover-open")) return;
      let cancelled = false;
      const exits = [...panel.getAnimations(), ...scrim.getAnimations()].map((a) => a.finished);
      Promise.allSettled(exits).then(() => {
        if (cancelled) return;
        nav.hidePopover();
        nav.style.removeProperty("--nav-top");
        nav.style.removeProperty("--nav-left");
      });
      return () => {
        cancelled = true;
      };
    }

    opened.current = true;
    // On tablets, place the panel under the header and pin the header
    // button where it is, before either joins the top layer.
    const place = () => {
      if (!tablet()) return;
      const header = navSlot?.closest("header");
      if (header) {
        const h = header.getBoundingClientRect();
        panel.style.setProperty("--panel-top", `${h.bottom + 8}px`);
        panel.style.setProperty("--panel-left", `${h.left}px`);
        panel.style.setProperty("--panel-width", `${h.width}px`);
      }
      // The slot keeps the button's 32px place in the header, so it's where
      // the button is, in or out of the top layer.
      const b = navSlot!.getBoundingClientRect();
      nav!.style.setProperty("--nav-top", `${b.top}px`);
      nav!.style.setProperty("--nav-left", `${b.left}px`);
    };
    place();
    // Not shown yet, or still playing its exit (reopened mid-close).
    if (!scrim.matches(":popover-open")) scrim.showPopover();
    if (!panel.matches(":popover-open")) panel.showPopover();
    // The panel joined the top layer above the button; re-show the button
    // so it's on top again. It stays displayed throughout (its display is
    // set in CSS), so this never flickers or restarts its transitions.
    for (const button of tablet() ? [nav!] : [fab]) {
      if (button.matches(":popover-open")) button.hidePopover();
      button.showPopover();
    }
    if (scrollerRef.current) callbacks.current.onOpened?.(scrollerRef.current);
    // Into the panel itself, not its first control, so a tap shows no ring.
    moveFocus(panel, pointerInput.current);

    const restoreInert = inertOthers(nav ? [root, nav] : [root]);
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
  }, [open, navButton]);

  return (
    <div ref={rootRef} className={styles.root} data-nav={navButton ? "" : undefined}>
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
        <IconMorph icon={icon} size={20} />
        <span className={styles.labelClip} aria-hidden>
          <span className={styles.labelTrack}>
            <span className={styles.label}>{title}</span>
          </span>
        </span>
      </button>
    </div>
  );
}

export type FabPanelHeaderButtonProps = {
  /** FabPanel's navButton ref. */
  ref: Ref<HTMLButtonElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The same title and icon as the FabPanel. */
  title: string;
  icon: IconName;
  /** The FabPanel's id. */
  controls: string;
};

/**
 * The queue's trigger on tablets (DESIGN.md, FabPanel): a round 32px
 * button in Approve's primary style, in the AppHeader's actions slot (the
 * slot keeps its 32px place). Rendered with the header, so it's in the
 * server HTML; FabPanel moves it into the top layer while the panel is
 * open. Hidden on phones by the screen, which shows the FAB there.
 */
export function FabPanelHeaderButton({ ref, open, onOpenChange, title, icon, controls }: FabPanelHeaderButtonProps) {
  const name = title.toLowerCase();
  return (
    <button
      ref={ref}
      type="button"
      popover="manual"
      className={styles.navButton}
      data-open={open ? "" : undefined}
      aria-label={open ? `Close ${name}` : `Open ${name}`}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={controls}
      onClick={() => onOpenChange(!open)}
    >
      <IconMorph icon={icon} size={18} />
    </button>
  );
}

/** The trigger's icon and the close ×, stacked; data-open on the button turns one into the other. */
function IconMorph({ icon, size }: { icon: IconName; size: 18 | 20 }) {
  return (
    <span className={styles.icons} data-size={size} aria-hidden>
      <span className={styles.openIcon}>
        <Icon name={icon} size={size} />
      </span>
      <span className={styles.closeIcon}>
        <Icon name="close" size={size} />
      </span>
    </span>
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

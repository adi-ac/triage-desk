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
  /**
   * Read when a close starts: put the page at the top first, instantly,
   * while the panel and scrim still cover it, then run the close. The inbox
   * sets it when a picked ticket has opened. Any other close leaves the
   * page exactly where it was.
   */
  scrollTopOnClose?: boolean;
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
export function HeaderPanel({
  open,
  onOpenChange,
  title,
  id,
  button,
  children,
  onOpened,
  scrollTopOnClose = false,
}: HeaderPanelProps) {
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

  // The close animation while it runs (or runs back, after a reopen).
  const exit = useRef<Exit | null>(null);
  // Where the last press on the scrim started, so a drag doesn't close it.
  const scrimPress = useRef<{ x: number; y: number } | null>(null);
  // The page lock (inert, no scrolling) from open until the close finishes.
  const lock = useRef<PageLock | null>(null);
  // Never leave the page locked if this unmounts while open or closing.
  useEffect(
    () => () => {
      lock.current?.release();
      lock.current = null;
    },
    [],
  );
  // A layout effect declared before the main one, so the main effect reads
  // this render's values.
  const latest = useRef({ onOpenChange, onOpened, scrollTopOnClose });
  useLayoutEffect(() => {
    latest.current = { onOpenChange, onOpened, scrollTopOnClose };
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

    // Once the close animation has finished, never before: the panel and
    // scrim close, the button leaves the top layer, and the page is let go
    // (no longer inert, scrollable again, at the position it's meant to be).
    const finishClose = () => {
      if (panel.matches(":popover-open")) panel.hidePopover();
      if (scrim.matches(":popover-open")) scrim.hidePopover();
      // Drop the animations' end state only once hidden, so the next open
      // starts from the CSS entrance again.
      exit.current?.animations.forEach((a) => a.cancel());
      exit.current = null;
      panel.inert = false;
      if (trigger.matches(":popover-open")) trigger.hidePopover();
      trigger.style.removeProperty("--button-top");
      trigger.style.removeProperty("--button-left");
      lock.current?.release();
      lock.current = null;
    };

    if (!open) {
      if (!panel.matches(":popover-open")) return;
      // A picked ticket has opened: put the page at the top now, instantly,
      // while the panel and scrim still cover it, and let at least one frame
      // paint there, fully covered, before the close starts (Safari can
      // otherwise paint the jump and the close's first frame together).
      const toTop = latest.current.scrollTopOnClose && !exit.current;
      if (toTop) lock.current?.scrollToTop();
      // Back to the button, unless it already has focus (it was the close).
      // The browser shows the ring only after keyboard use (Escape, Enter
      // on a ticket), not after a tap or click.
      if (document.activeElement !== trigger) moveFocus(trigger, pointerInput.current);
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishClose();
        return;
      }
      // The panel and scrim stay open (in the top layer) while the exit
      // runs, and close when it finishes. Not with CSS exit transitions on
      // display and overlay: Safari doesn't support transitioning overlay,
      // so hidePopover() would drop them from the top layer at once and
      // the exit would never be seen.
      panel.inert = true;
      let frame = 0;
      const startClose = () => {
        const run = {};
        if (exit.current) {
          // Reopened and closed again while it was running back: run it
          // forward again from where it is.
          exit.current.animations.forEach((a) => a.reverse());
        } else {
          exit.current = { animations: closeAnimations(panel, scrim), run };
        }
        exit.current.run = run;
        const current = exit.current;
        Promise.allSettled(current.animations.map((a) => a.finished)).then(() => {
          if (exit.current === current && current.run === run) finishClose();
        });
      };
      if (!toTop) {
        startClose();
        return;
      }
      frame = requestAnimationFrame(() => (frame = requestAnimationFrame(startClose)));
      // Reopened before it started: it never starts.
      return () => cancelAnimationFrame(frame);
    }

    // Reopened during the close: run the close back to open, then drop it.
    const reopening = exit.current;
    if (reopening) {
      const run = {};
      reopening.run = run;
      panel.inert = false;
      reopening.animations.forEach((a) => a.reverse());
      Promise.allSettled(reopening.animations.map((a) => a.finished)).then(() => {
        if (exit.current !== reopening || reopening.run !== run) return;
        reopening.animations.forEach((a) => a.cancel());
        exit.current = null;
      });
    }
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
    if (!reopening && scrollerRef.current) latest.current.onOpened?.(scrollerRef.current);
    // Into the panel itself, not its first control, so a tap shows no ring.
    moveFocus(panel, pointerInput.current);

    // Still held from before if this reopens during a close.
    lock.current ??= lockPage([root, trigger], scrollerRef.current ?? panel);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        latest.current.onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    addEventListener("resize", place);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("resize", place);
    };
  }, [open, button]);

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        ref={scrimRef}
        popover="manual"
        className={styles.scrim}
        // A tap on the scrim shouldn't take focus off the button (it would
        // land on the page), including taps during the close, which are
        // ignored.
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => (scrimPress.current = { x: e.clientX, y: e.clientY })}
        // Only a tap closes it. The scrim can't pan (it's part of the scroll
        // lock), so on iOS a drag across it would otherwise end in a click.
        onClick={(e) => {
          const press = scrimPress.current;
          if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 10) return;
          onOpenChange(false);
        }}
      />
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

/** The running close: its animations, and which run (close or reopen) owns them now. */
type Exit = { animations: Animation[]; run: object };

/** A motion token from styles/motion.css: a duration or delay in ms, or an easing. */
function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
const ms = (name: string) => {
  const value = token(name);
  return value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
};

/**
 * The close, with the Web Animations API (DESIGN.md, Motion): the panel
 * clips back to its top-right corner (the reverse of the opening clip)
 * while it fades out, starting a little later, and the scrim fades out.
 * Each starts from its current value, so a close during the opening runs
 * from wherever the opening had reached. They hold their end state until
 * the component hides the popovers.
 */
function closeAnimations(panel: HTMLElement, scrim: HTMLElement) {
  const options = (duration: string, easing: string, delay?: string): KeyframeAnimationOptions => ({
    duration: ms(duration),
    easing: token(easing),
    delay: delay ? ms(delay) : 0,
    fill: "forwards",
  });
  return [
    panel.animate([{ clipPath: "inset(0 0 100% 100% round 20px)" }], options("--duration-panel-out", "--ease-panel-out")),
    panel.animate(
      [{ opacity: 0 }],
      options("--duration-panel-fade-out", "--ease-panel-fade-out", "--delay-panel-fade-out"),
    ),
    scrim.animate([{ opacity: 0 }], options("--duration-scrim-out", "--ease-panel-out")),
  ];
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

type PageLock = { release: () => void; scrollToTop: () => void };

/**
 * Locks the page while the panel is open: everything outside `keep` is
 * inert, and the page can't scroll or rubber-band, in iOS Safari too. The
 * root gets overflow: hidden and no overscroll; on iOS that alone doesn't
 * stop a touch drag, so a drag that doesn't start in a scrollable part of
 * `scrollable` (the panel's list) is cancelled (touchmove, not passive),
 * and the scrim and the panel's header refuse to pan (touch-action, in the
 * CSS). Not overflow: hidden on <body>: that makes body a scroll container
 * and the sticky header would stop sticking and jump. The scroll position
 * is kept, and set back exactly on release, unless scrollToTop moved it.
 * Never lift and re-apply the overflow lock while it's held (see
 * scrollToTop).
 */
function lockPage(keep: Element[], scrollable: Element): PageLock {
  const html = document.documentElement;
  let target = window.scrollY;
  const before = [html.style.overflow, html.style.overscrollBehavior];
  const apply = () => {
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
  };
  const lift = () => {
    [html.style.overflow, html.style.overscrollBehavior] = before;
  };
  const onTouchMove = (e: TouchEvent) => {
    const inList = e.target instanceof Node && scrollable.contains(e.target);
    if (!inList || scrollable.scrollHeight <= scrollable.clientHeight) e.preventDefault();
  };
  apply();
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  const restoreInert = inertOthers(keep);
  return {
    scrollToTop() {
      // The lock stays on: overflow: hidden doesn't block a scripted scroll,
      // and lifting and re-applying it makes iOS Safari rebuild its
      // scrolling layers, which repaints the sticky header for a frame (a
      // visible blink). "instant" overrides any CSS scroll-behavior.
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      target = 0;
    },
    release() {
      lift();
      document.removeEventListener("touchmove", onTouchMove);
      restoreInert();
      if (Math.abs(window.scrollY - target) >= 1) window.scrollTo({ top: target, left: 0, behavior: "instant" });
    },
  };
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

"use client";

import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { initialFocus, moveFocus, ms, reducedMotion, token, useLastInputWasPointer } from "./focus";
import { Icon, type IconName } from "./icon";
import { IconButton } from "./icon-button";
import styles from "./header-panel.module.css";

/**
 * HeaderPanel's second view: its own header (a back button and a title)
 * and content, which the panel switches to from the main view (the queue's
 * New ticket form).
 */
export type HeaderPanelSubview = {
  /** Whether it's the view showing. */
  open: boolean;
  /** Its heading ("New ticket"). */
  title: string;
  /** The back button's name ("Back to queue"). */
  backLabel: string;
  /** Called on the back button and on Escape: show the main view again. */
  onBack: () => void;
  /**
   * From 768px (tablets), the panel narrows to this width, centered in the
   * viewport, while this view shows. Phones keep the panel's size.
   */
  narrowTo?: number;
  /**
   * Its content, filling the view: it handles its own scrolling. Going back
   * resets it: HeaderPanel remounts it (a form comes back empty, scrolled
   * to the top) once the view has finished sliding out, or at once if it's
   * opened again before then.
   */
  children: ReactNode;
};

export type HeaderPanelProps = {
  open: boolean;
  /** Called with false on the button, a scrim tap or Escape; the screen also closes it when a choice is made inside. */
  onOpenChange: (open: boolean) => void;
  /** One word: the panel's heading and name ("Queue"). */
  title: string;
  /** How many items the panel holds, right after the title ("Queue 40"). */
  count?: number;
  /** One small secondary Button on the header's right edge, e.g. the queue's New ticket. */
  action?: ReactNode;
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
  /** A second view, with a back button to the main one (DESIGN.md, HeaderPanel). */
  subview?: HeaderPanelSubview;
  /** Called once the panel has fully closed (after its exit): e.g. to reset its view and clear a form. */
  onClosed?: () => void;
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
  count,
  action,
  id,
  button,
  children,
  onOpened,
  scrollTopOnClose = false,
  subview,
  onClosed,
}: HeaderPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const subviewRef = useRef<HTMLDivElement>(null);
  const subHeadingRef = useRef<HTMLHeadingElement>(null);
  const ownId = useId();
  const panelId = id ?? ownId;
  const subOpen = subview?.open ?? false;

  // Whether the last input was a pointer (tap or click) or a key, so focus
  // moves without a ring after a tap even if the keyboard was used before.
  const pointerInput = useLastInputWasPointer();
  // The subview's content is remounted (a new key) to reset it after Back.
  // pending: Back was taken and the reset waits for the slide out to end.
  // If the subview opens again first, its key changes here, during the
  // render that opens it, so the old content never paints again.
  const [sub, setSub] = useState({ key: 0, pending: false, open: subOpen });
  if (sub.open !== subOpen) {
    setSub({
      key: subOpen && sub.pending ? sub.key + 1 : sub.key,
      pending: subOpen ? false : sub.pending,
      open: subOpen,
    });
  }
  // Places the panel (set while it's open): under the header, or narrowed
  // for the subview on tablets.
  const placeRef = useRef<((instant: boolean) => void) | null>(null);

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
  const latest = useRef({ onOpenChange, onOpened, scrollTopOnClose, subview, onClosed, goBack: () => {} });
  // Back (the back button and Escape): the screen shows the main view, and
  // the subview's content is reset once it has slid out (onTransitionEnd
  // below), so the fields don't visibly empty while it leaves; at once
  // under reduced motion.
  const goBack = () => {
    setSub((s) => (reducedMotion() ? { ...s, key: s.key + 1, pending: false } : { ...s, pending: true }));
    subview?.onBack();
  };
  useLayoutEffect(() => {
    latest.current = { onOpenChange, onOpened, scrollTopOnClose, subview, onClosed, goBack };
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
      placeRef.current = null;
      latest.current.onClosed?.();
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
      if (reducedMotion()) {
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
    // Place the panel under the header row, as wide as it, and pin the
    // button where it is, before either joins the top layer; again on
    // resize. With the subview showing on a tablet, the panel is narrowed
    // instead: centered in the viewport, at the same height. Its left edge
    // and width transition (CSS), except on resize (instant), so it stays
    // put while the window changes.
    const place = (instant: boolean) => {
      const header = slot.closest("header");
      if (header) {
        const h = header.getBoundingClientRect();
        const narrowTo = latest.current.subview?.open ? latest.current.subview.narrowTo : undefined;
        const narrow = narrowTo !== undefined && matchMedia("(min-width: 768px)").matches;
        const viewport = document.documentElement.clientWidth;
        const width = narrow ? Math.min(narrowTo, viewport - 32) : h.width;
        const left = narrow ? (viewport - width) / 2 : h.left;
        if (instant) panel.style.transitionProperty = "clip-path";
        panel.style.setProperty("--panel-top", `${h.bottom + 8}px`);
        panel.style.setProperty("--panel-left", `${left}px`);
        panel.style.setProperty("--panel-width", `${width}px`);
        if (instant) {
          // Apply the new place untransitioned, then allow the transitions again.
          void panel.offsetWidth;
          panel.style.removeProperty("transition-property");
        }
      }
      const b = slot.getBoundingClientRect();
      trigger.style.setProperty("--button-top", `${b.top}px`);
      trigger.style.setProperty("--button-left", `${b.left}px`);
    };
    const onResize = () => place(true);
    placeRef.current = place;
    place(true);
    // iOS with the on-screen keyboard open: the layout viewport keeps its
    // height and the keyboard covers the bottom of the panel. The panel
    // never shrinks or moves; how much of it is covered goes to
    // --panel-keyboard (zero otherwise), which the New ticket form turns
    // into extra scroll room, so its footer can be scrolled above the
    // keyboard. The focused field is brought into view inside the panel,
    // above the keyboard, smoothly and only when it's hidden (revealFocused).
    // A tap on a field focuses it without iOS's own scroll (NewTicketForm);
    // if iOS pans the page anyway (the keyboard opening, Safari's ↑ ↓ field
    // arrows), the lock puts it back (restore() only scrolls if the page
    // has actually moved).
    const viewport = window.visualViewport;
    let keyboard = 0;
    const fitKeyboard = () => {
      if (!viewport) return;
      // Open: the visual viewport is shorter than the window (not zoomed).
      const open = Math.abs(viewport.scale - 1) < 0.01 && viewport.height < innerHeight - 1;
      // Put the page back first if it moved (that fires another
      // visualViewport scroll, so this runs again with fresh values).
      lock.current?.restore();
      const covered = open ? panel.getBoundingClientRect().bottom - (viewport.offsetTop + viewport.height) : 0;
      const next = Math.max(0, Math.round(covered));
      if (next === keyboard) return;
      panel.style.setProperty("--panel-keyboard", `${next}px`);
      // The keyboard opened or changed height (the AutoFill bar shows for
      // the name fields, not for Message): reveal the focused field only if
      // it's now covered; never just because the height changed.
      if (next > 0) revealFocused(panel);
      keyboard = next;
    };
    // Focus moved to another field with the keyboard open (a tap, or
    // Safari's ↑ ↓ arrows, which move focus without a tap): in the next
    // frame, put the page back if iOS panned it, then reveal the field if
    // it's hidden.
    const onFocusIn = () => {
      if (keyboard === 0) return;
      requestAnimationFrame(() => {
        lock.current?.restore();
        revealFocused(panel);
      });
    };
    panel.addEventListener("focusin", onFocusIn);
    fitKeyboard();
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
    lock.current ??= lockPage([root, trigger], panel);
    // Escape goes back from the subview, and closes the panel from the main view.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      const sub = latest.current.subview;
      if (sub?.open) latest.current.goBack();
      else latest.current.onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    addEventListener("resize", onResize);
    viewport?.addEventListener("resize", fitKeyboard);
    viewport?.addEventListener("scroll", fitKeyboard);
    return () => {
      panel.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
      removeEventListener("resize", onResize);
      viewport?.removeEventListener("resize", fitKeyboard);
      viewport?.removeEventListener("scroll", fitKeyboard);
    };
  }, [open, button, pointerInput]);

  // Switching views while open: the panel narrows or widens (tablets), and
  // focus moves. Into the subview: its first field, or its heading on touch
  // devices (no keyboard pops up). Back: to the main header's action (New
  // ticket), which opened it. The views' fade and slide are CSS
  // transitions on data-active.
  const shownSub = useRef(subOpen);
  useLayoutEffect(() => {
    if (shownSub.current === subOpen) return;
    shownSub.current = subOpen;
    const place = placeRef.current;
    if (!place) return;
    place(reducedMotion());
    const target = subOpen
      ? subviewRef.current && subHeadingRef.current
        ? initialFocus(subviewRef.current, subHeadingRef.current)
        : null
      : (actionRef.current?.querySelector<HTMLElement>("button, a[href]") ?? panelRef.current);
    if (target) moveFocus(target, pointerInput.current);
  }, [subOpen, pointerInput]);

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
        <div className={styles.views}>
          <div className={styles.view} data-view="main" data-active={subOpen ? undefined : ""} inert={subOpen}>
            <div className={styles.header}>
              <div className={styles.heading}>
                <h2 className={`text-heading ${styles.title}`}>{title}</h2>
                {count !== undefined && <span className={`text-small ${styles.count}`}>{count}</span>}
              </div>
              {action && (
                <div ref={actionRef} className={styles.action}>
                  {action}
                </div>
              )}
            </div>
            <div ref={scrollerRef} className={styles.content}>
              {children}
            </div>
          </div>
          {subview && (
            <div
              ref={subviewRef}
              className={styles.view}
              data-view="sub"
              data-active={subOpen ? "" : undefined}
              inert={!subOpen}
              // Its fade out after Back has finished: reset its content now.
              onTransitionEnd={(e) => {
                if (e.target !== e.currentTarget || e.propertyName !== "opacity") return;
                if (!subOpen && sub.pending) setSub((s) => ({ ...s, key: s.key + 1, pending: false }));
              }}
            >
              <div className={`${styles.header} ${styles.subHeader}`}>
                <IconButton icon="chevron-left" size="small" aria-label={subview.backLabel} onClick={goBack} />
                <h2 ref={subHeadingRef} tabIndex={-1} className={`text-heading ${styles.title}`}>
                  {subview.title}
                </h2>
              </div>
              <div className={styles.subContent}>
                <Fragment key={sub.key}>{subview.children}</Fragment>
              </div>
            </div>
          )}
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
    panel.animate(
      [{ clipPath: "inset(0 0 100% 100% round 20px)" }],
      options("--duration-panel-out", "--ease-panel-out"),
    ),
    panel.animate(
      [{ opacity: 0 }],
      options("--duration-panel-fade-out", "--ease-panel-fade-out", "--delay-panel-fade-out"),
    ),
    scrim.animate([{ opacity: 0 }], options("--duration-scrim-out", "--ease-panel-out")),
  ];
}

type PageLock = { release: () => void; scrollToTop: () => void; restore: () => void };

/**
 * Locks the page while the panel is open: everything outside `keep` is
 * inert, and the page can't scroll or rubber-band, in iOS Safari too. The
 * root gets overflow: hidden and no overscroll; on iOS that alone doesn't
 * stop a touch drag, so a drag that doesn't start in something that can
 * scroll inside `panel` (the queue's list, the New ticket form's fields or
 * its message) is cancelled (touchmove, not passive),
 * and the scrim and the panel's header refuse to pan (touch-action, in the
 * CSS). Not overflow: hidden on <body>: that makes body a scroll container
 * and the sticky header would stop sticking and jump. The scroll position
 * is kept, and set back exactly on release, unless scrollToTop moved it.
 * Never lift and re-apply the overflow lock while it's held (see
 * scrollToTop).
 */
function lockPage(keep: Element[], panel: Element): PageLock {
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
    if (!canScroll(e.target, panel)) e.preventDefault();
  };
  // Anything that scrolls the page while it's locked (iOS panning to a
  // field focused with Safari's ↑ ↓ arrows) is put back as soon as the
  // scroll is seen, in the same frame, before it paints.
  const onScroll = () => putBack();
  // The layout scroll, or (iOS, not zoomed) the visual viewport panned
  // over it: either way the page has moved.
  const putBack = () => {
    const viewport = window.visualViewport;
    const panned = viewport && Math.abs(viewport.scale - 1) < 0.01 && Math.abs(viewport.offsetTop) >= 1;
    if (Math.abs(window.scrollY - target) >= 1 || panned) {
      window.scrollTo({ top: target, left: 0, behavior: "instant" });
    }
  };
  apply();
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  addEventListener("scroll", onScroll, { passive: true });
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
    // Back to where the page is meant to be, only if something scrolled it
    // while locked (iOS panning to a focused field); otherwise nothing.
    restore() {
      putBack();
    },
    release() {
      lift();
      document.removeEventListener("touchmove", onTouchMove);
      removeEventListener("scroll", onScroll);
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

/** Whether `target` is in something inside `panel` that can scroll vertically. */
function canScroll(target: EventTarget | null, panel: Element) {
  for (let el = target instanceof Element ? target : null; el && el !== panel; el = el.parentElement) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === "auto" || overflow === "scroll") && el.scrollHeight > el.clientHeight) return true;
  }
  return false;
}

/**
 * Brings the focused field (with its label) into view inside the panel's
 * scrolling area, within the part above the on-screen keyboard, without
 * scrolling the page. Only when it isn't fully visible there, 12px clear
 * above and below; then by the smallest distance (the nearest edge),
 * smoothly. A field already in view never moves. A field taller than the
 * area (the message) shows its label and top, where the caret starts.
 */
function revealFocused(panel: HTMLElement) {
  const field = document.activeElement;
  if (!(field instanceof HTMLElement) || !panel.contains(field)) return;
  for (let box = field.parentElement; box && box !== panel; box = box.parentElement) {
    const overflow = getComputedStyle(box).overflowY;
    if ((overflow !== "auto" && overflow !== "scroll") || box.scrollHeight <= box.clientHeight) continue;
    const rect0 = box.getBoundingClientRect();
    const viewport = window.visualViewport;
    const visibleBottom = viewport ? viewport.offsetTop + viewport.height : innerHeight;
    const area = { top: rect0.top, bottom: Math.min(rect0.bottom, visibleBottom) };
    const rect = field.getBoundingClientRect();
    // Its label too, when it has one above it.
    const label = "labels" in field ? (field as HTMLInputElement).labels?.[0] : undefined;
    const top = Math.min(rect.top, label?.getBoundingClientRect().top ?? rect.top);
    const margin = 12;
    let delta = 0;
    if (top < area.top + margin) delta = top - (area.top + margin);
    else if (rect.bottom > area.bottom - margin) {
      delta = Math.min(rect.bottom - (area.bottom - margin), top - (area.top + margin));
    }
    if (Math.abs(delta) >= 1) {
      box.scrollBy({
        top: delta,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
    return;
  }
}

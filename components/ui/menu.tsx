"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import buttonStyles from "./button.module.css";
import styles from "./menu.module.css";

export type MenuItem<T extends string> = { value: T; label: string };

export type MenuProps<T extends string> = {
  /** The trigger's words. Never an ellipsis: the caret says it opens. */
  label: string;
  /** The small overline at the top of the menu, and the menu's name: "Category". */
  heading: string;
  items: readonly MenuItem<T>[];
  onSelect: (value: T) => void;
  /** The trigger's Button size. */
  size?: "default" | "small";
};

/** Space between the trigger and the menu, and the menu and the viewport's edge. */
const gap = 4;
const edge = 8;

/**
 * A button that reveals more options: the label and a filled caret (never
 * an ellipsis), and a popover menu below it. The menu sits in the top
 * layer, so no pane clips it, and it floats over the layout instead of
 * pushing it. Left-aligned to the trigger, or right-aligned if that would
 * overflow; above it if there's no room below. Keyboard: focus moves to
 * the first item on open, Up/Down/Home/End move, Escape closes and returns
 * focus to the trigger. A click outside, a scroll or a resize closes it.
 */
export function Menu<T extends string>({ label, heading, items, onSelect, size = "default" }: MenuProps<T>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  const headingId = useId();

  const close = (returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  // Show in the top layer, place it, then focus the first item, all before paint.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!open || !popover || !trigger) return;
    popover.showPopover();
    const t = trigger.getBoundingClientRect();
    // Layout size, not getBoundingClientRect: the entrance starts at scale(0.97).
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const alignRight = t.left + width > innerWidth - edge;
    const above = t.bottom + gap + height > innerHeight - edge && t.top - gap - height >= edge;
    const left = alignRight ? Math.max(edge, t.right - width) : t.left;
    popover.style.left = `${left}px`;
    popover.style.top = `${above ? t.top - gap - height : t.bottom + gap}px`;
    popover.style.transformOrigin = `${above ? "bottom" : "top"} ${alignRight ? "right" : "left"}`;
    itemRefs.current[0]?.focus({ preventScroll: true });
    return () => {
      if (popover.matches(":popover-open")) popover.hidePopover();
    };
  }, [open]);

  // A click outside, a scroll anywhere or a resize closes it, leaving focus where it is.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!popoverRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };
    const onScroll = (e: Event) => {
      if (!popoverRef.current?.contains(e.target as Node)) close(false);
    };
    const onResize = () => close(false);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("scroll", onScroll, true);
    addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("scroll", onScroll, true);
      removeEventListener("resize", onResize);
    };
  }, [open]);

  function onMenuKeyDown(e: KeyboardEvent) {
    const nodes = itemRefs.current.filter((n): n is HTMLButtonElement => n !== null);
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const last = nodes.length - 1;
    const next = {
      ArrowDown: index >= last ? 0 : index + 1,
      ArrowUp: index <= 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (next !== undefined) {
      e.preventDefault();
      nodes[next]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") {
      // Leave the menu: focus goes on from the trigger, as if it had stayed there.
      close(true);
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`${size === "small" ? "text-small" : "text-body"} ${buttonStyles.button} ${styles.trigger}`}
        data-variant="secondary"
        data-size={size}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {label}
        <Caret />
      </button>
      {open && (
        <div ref={popoverRef} popover="manual" className={styles.popover} onKeyDown={onMenuKeyDown}>
          <p id={headingId} className={`text-overline ${styles.heading}`}>
            {heading}
          </p>
          <div id={menuId} role="menu" aria-labelledby={headingId} className={styles.list}>
            {items.map((item, i) => (
              <button
                key={item.value}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={`text-body ${styles.item}`}
                onClick={() => {
                  // The choice usually replaces the trigger (FieldReview), so focus isn't returned here.
                  close(false);
                  onSelect(item.value);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/** 12px, filled, with slightly rounded corners. Turns 180° while the menu is open. */
function Caret() {
  return (
    <svg className={styles.caret} width="12" height="12" viewBox="0 0 12 12" aria-hidden focusable="false">
      <path
        d="M3.2 4.6h5.6L6 8z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

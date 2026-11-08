"use client";

import { useEffect, useRef } from "react";

/**
 * Whether the last input was a pointer (tap or click) rather than a key, so
 * a component that moves focus can say whether to show a ring.
 */
export function useLastInputWasPointer() {
  const pointer = useRef(false);
  useEffect(() => {
    const onPointer = () => (pointer.current = true);
    const onKey = () => (pointer.current = false);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);
  return pointer;
}

/**
 * Focuses `el`, with a ring only after keyboard use. The browser's own
 * guess carries a ring over from the element losing focus, even after a
 * tap, so the component says which: no ring after a tap or click, the
 * usual ring after a key (Escape, Enter on an item).
 */
export function moveFocus(el: HTMLElement, afterPointer: boolean) {
  // focusVisible isn't in TypeScript's DOM types yet; browsers without it
  // ignore it and fall back to their own guess.
  const options = { preventScroll: true, focusVisible: !afterPointer };
  el.focus(options);
}

/** A phone or tablet: no keyboard is assumed, so nothing that opens one gets focus on its own. */
export function isTouchDevice() {
  return matchMedia("(pointer: coarse)").matches;
}

/**
 * Where focus goes when a form opens: the element marked data-autofocus
 * (its first field) on devices with a mouse or trackpad; on touch devices
 * `fallback` (its heading), so no on-screen keyboard pops up.
 */
export function initialFocus(container: Element, fallback: HTMLElement): HTMLElement {
  if (isTouchDevice()) return fallback;
  return container.querySelector<HTMLElement>("[data-autofocus]") ?? fallback;
}

/** A motion token from styles/motion.css: a duration or delay in ms, or an easing or other value. */
export function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function ms(name: string) {
  const value = token(name);
  return value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
}

export function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

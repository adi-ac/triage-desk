"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { storedTheme, themeStorageKey, type Theme } from "@/lib/theme";
import { SegmentedControl } from "./segmented-control";

const darkQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();

/** Puts the stored pick (or none) on <html> and tells every subscriber. */
function applyStoredTheme() {
  const root = document.documentElement;
  const t = storedTheme();
  if (t) root.dataset.theme = t;
  else delete root.dataset.theme;
  listeners.forEach((l) => l());
}

function pick(theme: Theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Storage blocked: the pick still applies for this page.
    document.documentElement.dataset.theme = theme;
  }
  if (storedTheme() === theme) applyStoredTheme();
  else listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  const mq = matchMedia(darkQuery);
  // A pick made in another tab applies here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === themeStorageKey) applyStoredTheme();
  };
  listeners.add(onChange);
  mq.addEventListener("change", onChange);
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onChange);
    removeEventListener("storage", onStorage);
  };
}

function snapshot(): Theme {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return matchMedia(darkQuery).matches ? "dark" : "light";
}

/** The theme on screen: the person's pick, or the OS's. Light on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, snapshot, () => "light");
}

const options = [
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
] as const;

/**
 * Two round icon buttons, sun and moon. The selected one is neutral, never
 * petrol. Follows the OS until a person picks, then remembers the pick.
 */
export function ThemeToggle() {
  const theme = useTheme();

  // The <head> script sets data-theme before paint; React's dev remount of
  // <html> clears it, so set it again before paint. A no-op in production.
  useLayoutEffect(applyStoredTheme, []);
  // Hydration renders the server's "light"; apply once more after useTheme
  // has subscribed (its effect runs before this one), so the selected
  // option catches up with the theme on screen.
  useEffect(applyStoredTheme, []);

  return <SegmentedControl aria-label="Theme" options={options} value={theme} onValueChange={pick} />;
}

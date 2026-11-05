"use client";

import { useEffect, useLayoutEffect, useSyncExternalStore } from "react";
import { storedTheme, themeStorageKey, type Theme, type ThemeChoice } from "@/lib/theme";
import { SegmentedControl } from "./segmented-control";

const darkQuery = "(prefers-color-scheme: dark)";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Puts the stored pick (or none, to follow the OS) on <html> and tells every subscriber. */
function applyStoredTheme() {
  const root = document.documentElement;
  const t = storedTheme();
  if (t) root.dataset.theme = t;
  else delete root.dataset.theme;
  notify();
}

/** Light or dark is remembered; system clears the pick and follows the OS again. */
function choose(choice: ThemeChoice) {
  const root = document.documentElement;
  try {
    if (choice === "system") localStorage.removeItem(themeStorageKey);
    else localStorage.setItem(themeStorageKey, choice);
  } catch {
    // Storage blocked: the choice still applies to this page.
  }
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  notify();
}

function subscribe(onChange: () => void) {
  // The OS setting changing: system follows it live.
  const mq = matchMedia(darkQuery);
  // A choice made in another tab applies here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === themeStorageKey || e.key === null) applyStoredTheme();
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

/** The choice in effect: <html data-theme> holds a pick; without one it's system. */
function choiceSnapshot(): ThemeChoice {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

function themeSnapshot(): Theme {
  const choice = choiceSnapshot();
  if (choice !== "system") return choice;
  return matchMedia(darkQuery).matches ? "dark" : "light";
}

/** The theme on screen: the person's pick, or the OS's. Light on the server. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, themeSnapshot, () => "light");
}

/** What the person chose: system (the default), light or dark. */
function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, choiceSnapshot, () => "system");
}

const options = [
  { value: "system", label: "System", icon: "monitor" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "dark", label: "Dark", icon: "moon" },
] as const;

/**
 * Three round icon options in a radiogroup: System (monitor), Light (sun),
 * Dark (moon), each named by aria-label; arrow keys move and select. The
 * selected one is neutral, never petrol. System is the default and follows
 * the OS live; Light or Dark overrides it and is remembered; System clears
 * the remembered choice.
 */
export function ThemeToggle() {
  const choice = useThemeChoice();

  // The <head> script sets data-theme before paint; React's dev remount of
  // <html> clears it, so set it again before paint. A no-op in production.
  useLayoutEffect(applyStoredTheme, []);
  // Hydration renders the server's "system"; apply once more after the
  // store has subscribed (its effect runs before this one), so the selected
  // option catches up with a remembered choice.
  useEffect(applyStoredTheme, []);

  return <SegmentedControl aria-label="Theme" options={options} value={choice} onValueChange={choose} />;
}

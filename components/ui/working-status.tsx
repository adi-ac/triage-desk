"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ms } from "./focus";
import styles from "./working-status.module.css";

/**
 * What the Triage pane's status says while the AI triages an added ticket.
 * Timed, not real progress: the triage is one model call (docs/brief.md).
 */
export const TRIAGE_STEPS = ["Reading the email…", "Weighing urgency…", "Drafting a reply…", "Triaging…"] as const;

export type WorkingStatusProps = {
  /** The words, in order, each ending in an ellipsis. Each shows for one step (2.2s); the last holds. */
  steps: readonly string[];
  /** While true it shows and moves; set false when the work is done and it fades out. */
  active: boolean;
};

/** A word on screen, by its step. */
type Word = { step: number };
type Sequence = { run: number; current: Word | null; previous: Word | null };

const first: Word = { step: 0 };

/** A word's shimmer (the first of its CSS animations). */
const shimmerOf = (word: Element | null) =>
  word
    ?.getAnimations()
    .find((a): a is CSSAnimation => a instanceof CSSAnimation && a.animationName.endsWith("shimmer"));

/**
 * Work in progress at the right end of a Pane header (Pane `status`): the
 * AI triaging an added ticket. text-mono-small in --ink-3, a 6px --accent
 * dot pulsing 7px before the words. Each time `active` turns true it starts
 * at the first step; every step the words crossfade and their box eases to
 * the new word's width, so the dot glides. The shimmer keeps one phase
 * across words. When `active` goes false it fades out from whatever word
 * it's on, and stays hidden; mounted inactive, it's hidden from the start.
 * Under reduced motion the words swap at once and nothing moves.
 * Decorative (aria-hidden): the loading content says the same to screen
 * readers.
 */
export function WorkingStatus({ steps, active }: WorkingStatusProps) {
  const box = useRef<HTMLSpanElement>(null);
  const [sequence, setSequence] = useState<Sequence>(() => ({
    run: 0,
    current: active ? first : null,
    previous: null,
  }));

  // Starting again from the first step whenever loading starts.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (active) setSequence((s) => ({ run: s.run + 1, current: first, previous: null }));
  }

  // The steps after the first, each at its time from the start; the last
  // holds. When loading ends, the shimmer holds where it is while the status
  // fades, and stays stopped while it's hidden. (Paused here rather than by
  // CSS: setting a shimmer's start time takes it out of CSS's play state.)
  const count = steps.length;
  useLayoutEffect(() => {
    if (!active) {
      box.current?.querySelectorAll(":scope > *").forEach((w) => shimmerOf(w)?.pause());
      return;
    }
    const step = ms("--duration-status-step");
    const timers = Array.from({ length: count - 1 }, (_, i) =>
      setTimeout(
        () =>
          setSequence((s) => ({
            ...s,
            previous: s.current,
            current: { step: i + 1 },
          })),
        (i + 1) * step,
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, sequence.run, count]);

  // The box takes the current word's width, measured in the real font
  // (again once the fonts have loaded). Its CSS eases the change after the
  // first step. The incoming word's shimmer takes the outgoing one's start
  // time, so the band runs on one clock and never restarts at a change.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const from = shimmerOf(el.querySelector("[data-out]"));
    const to = shimmerOf(el.querySelector("[data-current]"));
    if (from && to && from.startTime !== null) to.startTime = from.startTime;
    const fit = () => {
      const word = el.querySelector<HTMLElement>("[data-current]");
      if (word) el.style.width = `${word.getBoundingClientRect().width}px`;
    };
    fit();
    let live = true;
    document.fonts?.ready.then(() => live && fit());
    return () => {
      live = false;
    };
  }, [sequence]);

  const { run, current, previous } = sequence;
  const word = (w: Word, role: "current" | "previous") => (
    <span
      key={`${run}-${w.step}`}
      className={styles.word}
      data-current={role === "current" ? "" : undefined}
      data-in={role === "current" && w.step > 0 ? "" : undefined}
      data-out={role === "previous" ? "" : undefined}
    >
      {steps[w.step]}
    </span>
  );

  return (
    <span className={`text-mono-small ${styles.status}`} data-active={active ? "" : undefined} aria-hidden>
      <span className={styles.dot} />
      <span ref={box} className={styles.box} data-glide={current && current.step > 0 ? "" : undefined}>
        {previous && word(previous, "previous")}
        {current && word(current, "current")}
      </span>
    </span>
  );
}

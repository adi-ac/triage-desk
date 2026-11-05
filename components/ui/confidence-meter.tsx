import type { ComponentProps } from "react";
import { confidenceLevel, toPercent, unsureReason, type ConfidenceLevel } from "@/lib/confidence";
import styles from "./confidence-meter.module.css";

export { confidenceLevel, confidenceThresholds, toPercent, unsureReason, type ConfidenceLevel } from "@/lib/confidence";

const words: Record<ConfidenceLevel, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };

export type ConfidenceMeterProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** 0–1. The level is derived from it, never passed. */
  value: number;
  /** The runner-up's confidence, 0–1. Within 15 points makes the pick a close call. */
  runnerUp?: number;
  /** The runner-up's value ("How-to"), for the accessible text of a close call. */
  runnerUpLabel?: string;
  /** A person has kept or switched the value, so it no longer blocks Approve. */
  confirmed?: boolean;
};

/**
 * Always a bar, a percentage and a word, never a chip. Its color says
 * whether the field blocks Approve, not the confidence band: amber when it
 * needs a person first (under 60%, or within 15 points of the runner-up,
 * until a person keeps or switches it), Petrol when it doesn't. A pick that
 * blocks only because it's a close call reads "Close call" instead of its
 * level word. The value is Claude's own estimate, not a measured
 * probability; the accessible name says so on every meter. Always one line.
 */
export function ConfidenceMeter({ value, runnerUp, runnerUpLabel, confirmed = false, ...props }: ConfidenceMeterProps) {
  const percent = toPercent(value);
  const level = confidenceLevel(value);
  const reason = confirmed ? null : unsureReason(value, runnerUp);
  const word = reason === "close" ? "Close call" : words[level];
  const spoken =
    reason === "close"
      ? `close call with ${runnerUpLabel ?? "the runner-up"}, confirm before approving`
      : reason === "low"
        ? `${words[level].toLowerCase()}, confirm before approving`
        : words[level].toLowerCase();

  return (
    <div
      role="meter"
      aria-label="Confidence: the AI's estimate, not a measured probability"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%, ${spoken}`}
      {...props}
      className={`text-small ${styles.meter}`}
      data-level={level}
      data-blocks={reason ? "true" : "false"}
    >
      <span className={styles.reading}>
        <span className={styles.track}>
          <span className={styles.bar} style={{ inlineSize: `${percent}%` }} />
        </span>
        <span className="text-mono">{percent}%</span>
        <span>{word}</span>
      </span>
    </div>
  );
}

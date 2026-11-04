import type { ComponentProps } from "react";
import styles from "./confidence-meter.module.css";

export type ConfidenceLevel = "high" | "medium" | "low";

/** Lowest whole percentage for each level. */
export const confidenceThresholds = { high: 85, medium: 60 } as const;

const toPercent = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100);

/**
 * The level for a 0–1 value. It's read from the rounded percentage, so the
 * figure shown and the word beside it never disagree.
 */
export function confidenceLevel(value: number): ConfidenceLevel {
  const percent = toPercent(value);
  if (percent >= confidenceThresholds.high) return "high";
  if (percent >= confidenceThresholds.medium) return "medium";
  return "low";
}

const words: Record<ConfidenceLevel, string> = { high: "High", medium: "Medium", low: "Low" };

export type ConfidenceMeterProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** 0–1. The level is derived from it, never passed. */
  value: number;
};

/**
 * Always a bar, a percentage and a level word, never a chip: high shares
 * its petrol with decisions, so shape and words keep them apart.
 */
export function ConfidenceMeter({ value, ...props }: ConfidenceMeterProps) {
  const percent = toPercent(value);
  const level = confidenceLevel(value);

  return (
    <div
      role="meter"
      aria-label="Confidence"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%, ${words[level].toLowerCase()} confidence`}
      {...props}
      className={`text-small ${styles.meter}`}
      data-level={level}
    >
      <span className={styles.track}>
        <span className={styles.bar} style={{ inlineSize: `${percent}%` }} />
      </span>
      <span className="text-mono">{percent}%</span>
      <span>{words[level]} confidence</span>
      {level === "low" && <span className={styles.hint}>· confirm before approving</span>}
    </div>
  );
}

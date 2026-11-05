import type { ComponentProps } from "react";
import { confidenceLevel, toPercent, unsureReason, type ConfidenceLevel } from "@/lib/confidence";
import styles from "./confidence-meter.module.css";

export { confidenceLevel, confidenceThresholds, toPercent, unsureReason, type ConfidenceLevel } from "@/lib/confidence";

const words: Record<ConfidenceLevel, string> = { high: "High", medium: "Medium", low: "Low" };

/** Not shown: the meter has no hint text. Read out as part of its value. */
const spoken = { low: "confirm before approving", close: "close to the runner-up, confirm before approving" };

export type ConfidenceMeterProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** 0–1. The level is derived from it, never passed. */
  value: number;
  /** The runner-up's confidence, 0–1. Within 15 points makes the pick unsure. */
  runnerUp?: number;
  /** A person has kept or switched the value, so the hint to confirm is dropped. */
  confirmed?: boolean;
};

/**
 * Always a bar, a percentage and a level word, never a chip: high shares
 * its petrol with decisions, so shape and words keep them apart. The value
 * is Claude's own estimate, not a measured probability; the accessible name
 * says so on every meter. An unsure pick adds "confirm before approving" to
 * the accessible value until a person keeps or switches it; nothing extra is
 * shown. Always one line, never wrapping or scrolling sideways.
 */
export function ConfidenceMeter({ value, runnerUp, confirmed = false, ...props }: ConfidenceMeterProps) {
  const percent = toPercent(value);
  const level = confidenceLevel(value);
  const reason = confirmed ? null : unsureReason(value, runnerUp);

  return (
    <div
      role="meter"
      aria-label="Confidence: Claude's estimate, not a measured probability"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${percent}%, ${words[level].toLowerCase()} confidence${reason ? `, ${spoken[reason]}` : ""}`}
      {...props}
      className={`text-small ${styles.meter}`}
      data-level={level}
    >
      <span className={styles.reading}>
        <span className={styles.track}>
          <span className={styles.bar} style={{ inlineSize: `${percent}%` }} />
        </span>
        <span className="text-mono">{percent}%</span>
        <span>{words[level]} confidence</span>
      </span>
    </div>
  );
}

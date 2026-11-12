/** Confidence rules, shared by ConfidenceMeter and the Approve blockers. */

export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Whole percentages. high and medium are the lowest value for each level.
 * margin: a pick fewer than this many points ahead of its runner-up is
 * unsure, whatever its level.
 */
export const confidenceThresholds = { high: 80, medium: 60, margin: 15 } as const;

export const toPercent = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100);

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

/** Why a pick is unsure, or null when it isn't: under 60%, or within 15 points of the runner-up. */
export function unsureReason(value: number, runnerUp?: number): "low" | "close" | null {
  if (confidenceLevel(value) === "low") return "low";
  if (runnerUp !== undefined && toPercent(value) - toPercent(runnerUp) < confidenceThresholds.margin) return "close";
  return null;
}

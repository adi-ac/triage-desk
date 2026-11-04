import type { ComponentProps } from "react";
import styles from "./severity.module.css";

export type SeverityLevel = "urgent" | "high" | "normal" | "low";

const levels: Record<SeverityLevel, { word: string; bars: number }> = {
  urgent: { word: "Urgent", bars: 4 },
  high: { word: "High", bars: 3 },
  normal: { word: "Normal", bars: 2 },
  low: { word: "Low", bars: 1 },
};

export type SeverityProps = Omit<ComponentProps<"span">, "className" | "style" | "children"> & {
  level: SeverityLevel;
};

/**
 * How urgent a ticket is. Only urgent is a solid fill; high is red on a soft
 * fill; normal and low have no fill. The bars repeat the level without
 * color, and the word is always shown.
 */
export function Severity({ level, ...props }: SeverityProps) {
  const { word, bars } = levels[level];
  return (
    <span {...props} className={`text-body-strong ${styles.severity}`} data-level={level}>
      <span className={styles.bars} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={styles.bar} data-on={i < bars} data-step={i} />
        ))}
      </span>
      {word}
    </span>
  );
}

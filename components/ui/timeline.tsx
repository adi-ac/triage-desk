import { Children, type ReactNode } from "react";
import styles from "./timeline.module.css";

export type TimelineProps = {
  /** TimelineRows, oldest first. */
  children: ReactNode;
  /** Open on first render. Collapsed by default. */
  defaultOpen?: boolean;
};

/**
 * The activity timeline: collapsed by default behind "Activity · <count>",
 * so the record is one click away without crowding the triage pane.
 */
export function Timeline({ children, defaultOpen = false }: TimelineProps) {
  const count = Children.toArray(children).length;
  return (
    <details className={styles.timeline} open={defaultOpen}>
      <summary className={`text-overline ${styles.summary}`}>
        Activity · <span className="text-mono-small">{count}</span>
      </summary>
      <ol className={styles.list}>{children}</ol>
    </details>
  );
}

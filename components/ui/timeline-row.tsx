import type { ComponentProps } from "react";
import styles from "./timeline-row.module.css";

export type TimelineActor = "ai" | "human";

type TimelineRowBase = Omit<ComponentProps<"li">, "className" | "style"> & {
  /** Shown as written, e.g. "16:52". */
  time: string;
  /** Machine-readable time for the <time> element. */
  dateTime?: string;
};

/**
 * One entry in an activity timeline; put rows in an <ol>. Children describe
 * what happened ("drafted a reply"). ai is pencil (a dashed ring) and is
 * named "Model" unless you say otherwise (a team rule, say); human is ink (a
 * solid petrol dot) and must be named.
 */
export type TimelineRowProps = TimelineRowBase &
  ({ actor: "ai"; name?: string } | { actor: "human"; name: string });

export function TimelineRow({ actor, name, time, dateTime, children, ...props }: TimelineRowProps) {
  return (
    <li {...props} className={`text-small ${styles.row}`} data-actor={actor}>
      <span className={styles.marker} aria-hidden />
      <p className={styles.text}>
        <span className={styles.name}>{name ?? "Model"}</span> {children}
      </p>
      <time className={`text-mono-small ${styles.time}`} dateTime={dateTime}>
        {time}
      </time>
    </li>
  );
}

import type { ComponentProps } from "react";
import { Time } from "./time";
import styles from "./timeline-row.module.css";

export type TimelineActor = "ai" | "human";

type TimelineRowBase = Omit<ComponentProps<"li">, "className" | "style"> & {
  /** When it happened, ISO 8601. Shown in the viewer's time zone. */
  at: string;
};

/**
 * One entry in an activity timeline; put rows in an <ol>. Children describe
 * what happened ("drafted a reply"). ai is pencil (a soft gray dot) and is
 * named "AI" unless you say otherwise (a team rule, say); human is ink (a
 * solid petrol dot) and must be named.
 */
export type TimelineRowProps = TimelineRowBase &
  ({ actor: "ai"; name?: string } | { actor: "human"; name: string });

export function TimelineRow({ actor, name, at, children, ...props }: TimelineRowProps) {
  return (
    <li {...props} className={`text-small ${styles.row}`} data-actor={actor}>
      <span className={styles.marker} aria-hidden />
      <p className={styles.text}>
        <span className={styles.name}>{name ?? "AI"}</span> {children}
      </p>
      <span className={styles.time}>
        <Time dateTime={at} />
      </span>
    </li>
  );
}

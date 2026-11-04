import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./pane.module.css";

export type PaneProps = Omit<ComponentProps<"section">, "className" | "style" | "title"> & {
  /** The pane's name, shown in the tray header. */
  title: string;
  /** A short line or a Tag at the end of the header, e.g. a ticket ID. */
  meta?: ReactNode;
};

/**
 * A screen's pane: a gray tray holding the header and wrapping a white card.
 * The card scrolls on its own when the shell gives the pane a height.
 */
export function Pane({ title, meta, children, ...props }: PaneProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} {...props} className={styles.pane}>
      <div className={styles.header}>
        <h2 id={headingId} className={`text-heading ${styles.title}`}>
          {title}
        </h2>
        {meta && <div className={`text-small ${styles.meta}`}>{meta}</div>}
      </div>
      <div className={styles.card}>{children}</div>
    </section>
  );
}

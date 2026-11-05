import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./pane.module.css";

export type PaneProps = Omit<ComponentProps<"section">, "className" | "style" | "title"> & {
  /** The pane's name, shown in the tray header. */
  title: string;
  /** A short fact or a Tag at the end of the header, e.g. a ticket ID. Never a model suggestion. */
  meta?: ReactNode;
  /** Pinned to the bottom of the card while its content scrolls: the triage pane's ApproveBar. */
  footer?: ReactNode;
  /**
   * "list" insets the content 4px instead of 16px, for a list whose rows
   * carry their own 12px padding (the queue): row text still lines up with
   * the title, and a row's hover or selected fill has 4px on each side.
   */
  inset?: "default" | "list";
};

/**
 * A screen's pane: a gray tray holding the header and wrapping a white card.
 * The card's content scrolls on its own when the shell gives the pane a
 * height; the footer stays pinned at the bottom either way.
 */
export function Pane({ title, meta, footer, inset = "default", children, ...props }: PaneProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} {...props} className={styles.pane}>
      <div className={styles.header}>
        <h2 id={headingId} className={`text-heading ${styles.title}`}>
          {title}
        </h2>
        {meta && <div className={`text-small ${styles.meta}`}>{meta}</div>}
      </div>
      <div className={styles.card}>
        <div className={styles.content} data-inset={inset}>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </section>
  );
}

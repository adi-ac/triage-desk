import { useId, type ComponentProps, type ReactNode } from "react";
import styles from "./pane.module.css";

export type PaneProps = Omit<ComponentProps<"section">, "className" | "style" | "title"> & {
  /** The pane's name, shown in the tray header. */
  title: string;
  /** How many items the pane holds, right after the title ("Queue 40"). */
  count?: number;
  /** Work in progress, right after the title: a WorkingStatus ("Triaging…"). */
  status?: ReactNode;
  /** A short fact or a Tag at the end of the header, e.g. a ticket ID. Never a model suggestion. Not with action. */
  meta?: ReactNode;
  /**
   * One small secondary Button on the header's right edge, 6px from the
   * pane's edge, e.g. the queue's New ticket. It takes the meta's place.
   */
  action?: ReactNode;
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
export function Pane({ title, count, status, meta, action, footer, inset = "default", children, ...props }: PaneProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} {...props} className={styles.pane}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h2 id={headingId} className={`text-heading ${styles.title}`}>
            {title}
          </h2>
          {count !== undefined && <span className={`text-small ${styles.count}`}>{count}</span>}
          {status}
        </div>
        {meta && <div className={`text-small ${styles.meta}`}>{meta}</div>}
        {action && <div className={styles.action}>{action}</div>}
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

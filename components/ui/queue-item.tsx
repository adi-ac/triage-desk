import type { ComponentProps, ReactNode } from "react";
import { Time } from "./time";
import styles from "./queue-item.module.css";

export type QueueItemProps = Omit<ComponentProps<"button">, "className" | "style" | "children"> & {
  sender: string;
  company?: string;
  subject: string;
  /** The opening of the email, cut to one line. */
  preview: string;
  /** When the email arrived, ISO 8601. Shown in the viewer's time zone. */
  receivedAt: string;
  /** Tags such as "Sent by rule". Phrasing content only: it sits inside a button. */
  meta?: ReactNode;
  /** The ticket open beside the queue. */
  current?: boolean;
};

export function QueueItem({ sender, company, subject, preview, receivedAt, meta, current = false, type = "button", ...props }: QueueItemProps) {
  return (
    <button
      type={type}
      aria-current={current ? "true" : undefined}
      {...props}
      className={`text-small ${styles.item}`}
    >
      <span className={styles.top}>
        <span className={`text-body-strong ${styles.sender}`}>{sender}</span>
        {company && <span className={styles.company}>{company}</span>}
        <span className={styles.time}>
          <Time dateTime={receivedAt} />
        </span>
      </span>
      <span className={`text-body ${styles.subject}`}>{subject}</span>
      <span className={styles.preview}>{preview}</span>
      {meta && <span className={styles.meta}>{meta}</span>}
    </button>
  );
}

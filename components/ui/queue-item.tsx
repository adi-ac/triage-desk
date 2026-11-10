import Link, { type LinkProps } from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Time } from "./time";
import styles from "./queue-item.module.css";

type QueueItemContent = {
  sender: string;
  company?: string;
  subject: string;
  /** The opening of the email, cut to one line. */
  preview: string;
  /** When the email arrived, ISO 8601. Shown in the viewer's time zone, unless the row has a tag (meta). */
  receivedAt: string;
  /**
   * One Tag, such as "Sent by rule", at the first line's end in the date's
   * place (the date isn't shown). Phrasing content only: it sits inside a link or button.
   */
  meta?: ReactNode;
  /** The ticket open beside the queue. */
  current?: boolean;
};

type AnchorProps = Omit<ComponentProps<"a">, "className" | "style" | "children" | "href">;
type ButtonProps = Omit<ComponentProps<"button">, "className" | "style" | "children">;

export type QueueItemProps = QueueItemContent &
  (
    | ({
        /**
         * The ticket's URL: the row is a link, so Cmd/Ctrl-click and the
         * middle button open it in a new tab. A plain click goes through
         * `onNavigate`, which can take over the navigation (preventDefault).
         */
        href: string;
        onNavigate?: LinkProps["onNavigate"];
      } & AnchorProps)
    | ({ href?: undefined; onNavigate?: undefined } & ButtonProps)
  );

/**
 * One ticket in a queue list. With `href` it's a link to the ticket (the
 * inbox); without, a button (demos). Not prefetched: opening a ticket reads
 * the inbox's own state, so there's nothing to fetch ahead.
 */
export function QueueItem({
  sender,
  company,
  subject,
  preview,
  receivedAt,
  meta,
  current = false,
  ...props
}: QueueItemProps) {
  const content = (
    <>
      <span className={styles.top}>
        <span className={`text-body-strong ${styles.sender}`}>{sender}</span>
        {company && <span className={styles.company}>{company}</span>}
        {meta ? (
          <span className={styles.meta}>{meta}</span>
        ) : (
          <span className={styles.time}>
            <Time dateTime={receivedAt} />
          </span>
        )}
      </span>
      <span className={`text-body ${styles.subject}`}>{subject}</span>
      <span className={styles.preview}>{preview}</span>
    </>
  );
  const className = `text-small ${styles.item}`;

  if (props.href !== undefined) {
    const { href, onNavigate, ...anchor } = props;
    return (
      <Link
        href={href}
        prefetch={false}
        onNavigate={onNavigate}
        {...anchor}
        aria-current={current ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    );
  }
  const { type = "button", href: _href, onNavigate: _onNavigate, ...button } = props;
  void _href;
  void _onNavigate;
  return (
    <button type={type} {...button} aria-current={current ? "true" : undefined} className={className}>
      {content}
    </button>
  );
}

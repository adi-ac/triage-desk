"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { QueueItem, Tag } from "@/components/ui";
import { ruleSendFor } from "@/fixtures/suggestions";
import type { Ticket } from "@/fixtures/tickets";
import { useInbox } from "./inbox-state";
import styles from "./inbox.module.css";

/** The email's opening, past any greeting line. */
function previewOf(body: string) {
  const paragraphs = body.split("\n\n").map((p) => p.trim());
  return (
    paragraphs.find((p) => !/^(hi|hello|hey|dear|hola|bonjour|good (morning|afternoon))\b[^\n]{0,40}$/i.test(p)) ??
    paragraphs[0]
  );
}

const groups = [
  { key: "needsReview", title: "Needs review" },
  { key: "noAction", title: "Probably no action" },
  { key: "untriaged", title: "Not triaged yet" },
  { key: "sent", title: "Sent" },
] as const;

type GroupKey = (typeof groups)[number]["key"];

/**
 * The queue's rows, grouped. Each row is a link to its ticket (Cmd/Ctrl-click
 * opens a new tab); a plain click goes through `onOpen`, which handles the
 * queue panel's close. One Tab stop for the whole list: the open ticket's row
 * (or the row last focused); Up and Down move between rows across groups,
 * Home and End go to the first and last.
 */
export function QueueList({ currentId, onOpen }: { currentId: string; onOpen: (id: string) => void }) {
  const { queue, stateFor, effectiveFor, suggestionOf, addedFor } = useInbox();
  // Both lists (the desktop pane and the queue panel) are on the page, so
  // their heading IDs are their own.
  const idPrefix = useId();
  const hintId = `${idPrefix}-hint`;

  // The row that takes Tab: the one last focused, else the open ticket.
  // Opening another ticket hands it back to that one.
  const [focused, setFocused] = useState<{ id: string; current: string } | null>(null);
  const order = groups.flatMap(({ key }) => queue[key].map((t) => t.id));
  const tabStop =
    focused && focused.current === currentId && order.includes(focused.id)
      ? focused.id
      : order.includes(currentId)
        ? currentId
        : order[0];

  // Tags follow the ticket's state live, even while its row holds its place.
  // A tag that repeats its group's heading is left out; one that adds to it
  // stays: "Sent by rule" and "Closed" always, and a state that no longer
  // matches the group (a ticket sent while it holds its place in Needs review).
  const meta = (t: Ticket, group: GroupKey) => {
    if (ruleSendFor(t.id)) return <Tag tone="ai">Sent by rule</Tag>;
    // An added ticket waiting for the AI sits in Needs review with no tag.
    if (addedFor(t.id)?.triage.status === "triaging") return null;
    if (!suggestionOf(t.id)) return group === "untriaged" ? null : <Tag>Not triaged</Tag>;
    if (stateFor(t.id).closedAt) return <Tag>Closed</Tag>;
    if (stateFor(t.id).sentAt) return group === "sent" ? null : <Tag tone="success">Sent</Tag>;
    if (effectiveFor(t.id)?.kind === "not-a-request") return group === "noAction" ? null : <Tag tone="ai">Not a request</Tag>;
    return group === "needsReview" ? null : <Tag tone="warning">Needs review</Tag>;
  };

  // Up, Down, Home and End move focus between the rows (the list scrolls the
  // row into view itself); everything else is left to the link.
  const onKeyDown = (e: KeyboardEvent<HTMLElement>, id: string) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const i = order.indexOf(id);
    const to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: order.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = order[Math.max(0, Math.min(order.length - 1, to))];
    const list = e.currentTarget.closest("[data-queue]");
    list?.querySelector<HTMLElement>(`[data-ticket-id="${CSS.escape(next)}"] > a`)?.focus();
  };

  return (
    <div className={styles.queue} data-queue="">
      <p id={hintId} className="visually-hidden">
        Up and Down arrows move between tickets.
      </p>
      {groups.map(({ key, title }) =>
        queue[key].length > 0 ? (
          <section key={key} className={styles.queueGroup} aria-labelledby={`${idPrefix}-${key}`}>
            <h3 id={`${idPrefix}-${key}`} className={`text-overline ${styles.groupTitle}`}>
              {title}
            </h3>
            <ul className={styles.queueList}>
              {queue[key].map((t) => (
                <li key={t.id} data-ticket-id={t.id}>
                  <QueueItem
                    href={`/tickets/${t.id}`}
                    current={t.id === currentId}
                    sender={t.from.name}
                    company={t.account?.company ?? addedFor(t.id)?.company}
                    subject={t.subject || "(No subject)"}
                    preview={previewOf(t.body)}
                    receivedAt={t.receivedAt}
                    meta={meta(t, key)}
                    tabIndex={t.id === tabStop ? 0 : -1}
                    // How to move on, said when the list is first entered.
                    aria-describedby={focused ? undefined : hintId}
                    onFocus={() => setFocused({ id: t.id, current: currentId })}
                    onKeyDown={(e) => onKeyDown(e, t.id)}
                    onNavigate={(e) => {
                      // A plain click or Enter: the inbox opens it (closing
                      // the queue panel first, without a page jump).
                      e.preventDefault();
                      onOpen(t.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </div>
  );
}

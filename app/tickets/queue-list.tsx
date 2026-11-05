"use client";

import { QueueItem, Tag } from "@/components/ui";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
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

export function QueueList({ currentId, onOpen }: { currentId: string; onOpen: (id: string) => void }) {
  const { queue, stateFor, effectiveFor } = useInbox();

  // Tags follow the ticket's state live, even while its row holds its place.
  // A tag that repeats its group's heading is left out; one that adds to it
  // stays: "Sent by rule" and "Closed" always, and a state that no longer
  // matches the group (a ticket sent while it holds its place in Needs review).
  const meta = (t: Ticket, group: GroupKey) => {
    if (ruleSendFor(t.id)) return <Tag tone="ai">Sent by rule</Tag>;
    if (!suggestionFor(t.id)) return group === "untriaged" ? null : <Tag>Not triaged</Tag>;
    if (stateFor(t.id).closedAt) return <Tag>Closed</Tag>;
    if (stateFor(t.id).sentAt) return group === "sent" ? null : <Tag tone="success">Sent</Tag>;
    if (effectiveFor(t.id)?.kind === "not-a-request") return group === "noAction" ? null : <Tag tone="ai">Not a request</Tag>;
    return group === "needsReview" ? null : <Tag tone="warning">Needs review</Tag>;
  };

  return (
    <div className={styles.queue}>
      {groups.map(({ key, title }) =>
        queue[key].length > 0 ? (
          <section key={key} className={styles.queueGroup} aria-labelledby={`queue-${key}`}>
            <h3 id={`queue-${key}`} className={`text-overline ${styles.groupTitle}`}>
              {title}
            </h3>
            <ul className={styles.queueList}>
              {queue[key].map((t) => (
                <li key={t.id}>
                  <QueueItem
                    current={t.id === currentId}
                    sender={t.from.name}
                    company={t.account?.company}
                    subject={t.subject || "(No subject)"}
                    preview={previewOf(t.body)}
                    receivedAt={t.receivedAt}
                    meta={meta(t, key)}
                    onClick={() => onOpen(t.id)}
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

"use client";

import { QueueItem, Tag } from "@/components/ui";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
import { tickets, type Ticket } from "@/fixtures/tickets";
import { orderQueue } from "@/lib/queue";
import { useInbox } from "./inbox-state";
import styles from "./inbox.module.css";

/** The email's opening, past any greeting line. */
function previewOf(body: string) {
  const paragraphs = body.split("\n\n").map((p) => p.trim());
  return paragraphs.find((p) => !/^(hi|hello|hey|dear|hola|bonjour|good (morning|afternoon))\b[^\n]{0,40}$/i.test(p)) ?? paragraphs[0];
}

export function useQueue() {
  const { decisionsFor } = useInbox();
  return orderQueue(tickets, suggestionFor, decisionsFor);
}

export function QueueList({ currentId, onOpen }: { currentId: string; onOpen: (id: string) => void }) {
  const { stateFor } = useInbox();
  const { triaged, untriaged } = useQueue();

  const meta = (t: Ticket) => {
    if (ruleSendFor(t.id)) return <Tag tone="ai">Sent by rule</Tag>;
    if (!suggestionFor(t.id)) return <Tag>Not triaged</Tag>;
    if (stateFor(t.id).sentAt) return <Tag tone="success">Sent</Tag>;
    return <Tag tone="warning">Needs review</Tag>;
  };

  const item = (t: Ticket) => (
    <li key={t.id}>
      <QueueItem
        current={t.id === currentId}
        sender={t.from.name}
        company={t.account?.company}
        subject={t.subject || "(No subject)"}
        preview={previewOf(t.body)}
        receivedAt={t.receivedAt}
        meta={meta(t)}
        onClick={() => onOpen(t.id)}
      />
    </li>
  );

  return (
    <div className={styles.queue}>
      <ul className={styles.queueList} aria-label="Triaged">
        {triaged.map(item)}
      </ul>
      {untriaged.length > 0 && (
        <section className={styles.queueGroup} aria-labelledby="not-triaged">
          <h3 id="not-triaged" className={`text-overline ${styles.groupTitle}`}>
            Not triaged yet
          </h3>
          <ul className={styles.queueList}>{untriaged.map(item)}</ul>
        </section>
      )}
    </div>
  );
}

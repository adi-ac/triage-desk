"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppHeader, IconButton, Pane, Sheet } from "@/components/ui";
import { tickets } from "@/fixtures/tickets";
import { InboxProvider } from "./inbox-state";
import { QueueList } from "./queue-list";
import styles from "./inbox.module.css";

/**
 * The inbox shell (DESIGN.md, Layout, with a queue): the header row, the
 * queue pane from 1200px or the queue sheet (behind "Open queue") below,
 * and the open ticket's email and triage panes.
 */
export function InboxShell({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  return (
    <InboxProvider currentId={id}>
      <Shell id={id}>{children}</Shell>
    </InboxProvider>
  );
}

function Shell({ id, children }: { id: string; children: ReactNode }) {
  const router = useRouter();
  const [queueOpen, setQueueOpen] = useState(false);
  const sheetList = useRef<HTMLDivElement>(null);

  const open = (ticketId: string) => {
    setQueueOpen(false);
    router.push(`/tickets/${ticketId}`);
  };

  // The sheet opens with the current ticket highlighted and scrolled into view.
  useEffect(() => {
    if (queueOpen) sheetList.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "center" });
  }, [queueOpen]);

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <AppHeader
          actions={
            <span className={styles.queueButton}>
              <IconButton icon="inbox" aria-label="Open queue" onClick={() => setQueueOpen(true)} />
            </span>
          }
        />
      </div>
      <h1 className="visually-hidden">Inbox</h1>

      <div className={styles.queuePane}>
        <Pane title="Queue" meta={`${tickets.length} tickets`}>
          <QueueList currentId={id} onOpen={open} />
        </Pane>
      </div>

      <Sheet open={queueOpen} onClose={() => setQueueOpen(false)} title="Queue">
        <div ref={sheetList}>
          <QueueList currentId={id} onOpen={open} />
        </div>
      </Sheet>

      <div className={styles.ticket}>{children}</div>
    </main>
  );
}

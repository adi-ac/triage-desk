"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppHeader, FabPanel, Pane } from "@/components/ui";
import { tickets } from "@/fixtures/tickets";
import { InboxProvider } from "./inbox-state";
import { QueueList } from "./queue-list";
import styles from "./inbox.module.css";

/**
 * The inbox shell (DESIGN.md, Layout, with a queue): the header row, the
 * queue pane from 1200px or, below, the queue FAB and the panel it opens,
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

  const open = (ticketId: string) => {
    setQueueOpen(false);
    router.push(`/tickets/${ticketId}`);
  };

  // From 1200px the queue is a pane and the FAB is hidden, so a panel left
  // open by resizing closes.
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1200px)");
    const onChange = () => {
      if (desktop.matches) setQueueOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  return (
    <main className={styles.shell}>
      <div className={styles.header}>
        <AppHeader />
      </div>
      <h1 className="visually-hidden">Inbox</h1>

      <div className={styles.queuePane}>
        <Pane title="Queue" meta={`${tickets.length} tickets`} inset="list">
          <QueueList currentId={id} onOpen={open} />
        </Pane>
      </div>

      <div className={styles.ticket}>{children}</div>

      <div className={styles.queueFab}>
        <FabPanel
          open={queueOpen}
          onOpenChange={setQueueOpen}
          title="Queue"
          icon="inbox"
          onOpened={centerCurrent}
        >
          <QueueList currentId={id} onOpen={open} />
        </FabPanel>
      </div>
    </main>
  );
}

/** The panel opens with the current ticket scrolled to the middle of its list. */
function centerCurrent(scroller: HTMLDivElement) {
  const item = scroller.querySelector('[aria-current="true"]');
  if (!item) return;
  const list = scroller.getBoundingClientRect();
  const row = item.getBoundingClientRect();
  scroller.scrollTop += row.top - list.top - (list.height - row.height) / 2;
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AppHeader, FabPanel, FabPanelHeaderButton, Pane } from "@/components/ui";
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
  // Tablets: the queue's header button (FabPanel navButton).
  const queueId = useId();
  const navButton = useRef<HTMLButtonElement>(null);

  const open = (ticketId: string) => {
    setQueueOpen(false);
    router.push(`/tickets/${ticketId}`);
  };

  // The queue's trigger and panel change with the width (FAB on phones,
  // header button on tablets, a pane from 1200px), so a panel left open by
  // resizing across 768px or 1200px closes.
  useEffect(() => {
    const queries = ["(min-width: 768px)", "(min-width: 1200px)"].map((q) => matchMedia(q));
    const onChange = () => setQueueOpen(false);
    queries.forEach((q) => q.addEventListener("change", onChange));
    return () => queries.forEach((q) => q.removeEventListener("change", onChange));
  }, []);

  // Tablets: whether the sticky header has stuck (12px from the top), which
  // shows the bar behind it. Read at most once a frame.
  const headerRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const header = headerRef.current;
      if (header) setStuck(getComputedStyle(header).position === "sticky" && header.getBoundingClientRect().top <= 12);
    };
    const onChange = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    check();
    addEventListener("scroll", onChange, { passive: true });
    addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onChange);
      removeEventListener("resize", onChange);
    };
  }, []);

  return (
    <main className={styles.shell}>
      <div
        ref={headerRef}
        className={styles.header}
        data-stuck={stuck ? "" : undefined}
        data-queue-open={queueOpen ? "" : undefined}
      >
        <AppHeader
          actions={
            <span className={styles.navSlot}>
              <FabPanelHeaderButton
                ref={navButton}
                open={queueOpen}
                onOpenChange={setQueueOpen}
                title="Queue"
                icon="inbox"
                controls={queueId}
              />
            </span>
          }
        />
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
          id={queueId}
          navButton={navButton}
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

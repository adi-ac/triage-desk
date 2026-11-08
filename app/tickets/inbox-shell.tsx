"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AppHeader, HeaderPanel, HeaderPanelButton, Pane } from "@/components/ui";
import { tickets } from "@/fixtures/tickets";
import { InboxProvider } from "./inbox-state";
import { QueueList } from "./queue-list";
import styles from "./inbox.module.css";

/**
 * The inbox shell (DESIGN.md, Layout, with a queue): the header row, the
 * queue pane from 1200px or, below, the queue's header button and the panel
 * it opens below the header,
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
  // Below 1200px: the queue's header button (HeaderPanel's button).
  const queueId = useId();
  const queueButton = useRef<HTMLButtonElement>(null);

  const open = (ticketId: string) => {
    setQueueOpen(false);
    router.push(`/tickets/${ticketId}`);
  };

  // From 1200px the queue is a pane and the header button is hidden, so a
  // panel left open by resizing past 1200px closes.
  useEffect(() => {
    const desktop = matchMedia("(min-width: 1200px)");
    const onChange = () => {
      if (desktop.matches) setQueueOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  // Below 1200px: whether the panes have passed under the sticky header's
  // bar (the header's bottom + 12px), which shows the bar. Read at most
  // once a frame.
  const headerRef = useRef<HTMLDivElement>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      const header = headerRef.current;
      // The first pane (the ticket wrapper is display: contents).
      const pane = [...(ticketRef.current?.children ?? [])].find((el) => el.getClientRects().length > 0);
      if (!header || !pane) return;
      const sticky = getComputedStyle(header).position === "sticky";
      setStuck(sticky && pane.getBoundingClientRect().top < header.getBoundingClientRect().bottom + 12);
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
              <HeaderPanelButton
                ref={queueButton}
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

      <div ref={ticketRef} className={styles.ticket}>
        {children}
      </div>

      <div className={styles.queuePanel}>
        <HeaderPanel
          open={queueOpen}
          onOpenChange={setQueueOpen}
          title="Queue"
          id={queueId}
          button={queueButton}
          onOpened={centerCurrent}
        >
          <QueueList currentId={id} onOpen={open} />
        </HeaderPanel>
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

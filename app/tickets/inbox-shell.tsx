"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AppHeader, Button, Dialog, HeaderPanel, HeaderPanelButton, NewTicketForm, Pane } from "@/components/ui";
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
  // A ticket picked in the queue panel that hasn't opened yet (see open below).
  const pending = useRef<{ id: string; timer: number; late: boolean } | null>(null);
  // Whether the queue is open, and whether its next close should first put
  // the page at the top (after a pick).
  const [queue, setQueue] = useState({ open: false, toTop: false });
  const queueOpen = queue.open;
  const setQueueOpen = (open: boolean) => {
    // Closed before a picked ticket opened: the page is already at the top
    // (see open below), so it stays there, and the ticket opens there.
    const picking = !open && pending.current !== null;
    if (picking) pending.current!.late = true;
    setQueue({ open, toTop: picking });
  };
  // Below 1200px: the queue's header button (HeaderPanel's button).
  const queueId = useId();
  const queueButton = useRef<HTMLButtonElement>(null);

  // New ticket: a dialog from 1200px; below, the queue panel's second view.
  // The form is cleared (remounted with a new key) when either closes.
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [queueView, setQueueView] = useState<"queue" | "new-ticket">("queue");
  const [formKey, setFormKey] = useState(0);
  const clearForm = () => setFormKey((k) => k + 1);

  // Picking a ticket in the queue panel, in this order, so the page never
  // visibly jumps and the header never blinks: put the page at the top
  // instantly while the panel and scrim still cover it; a frame later,
  // navigate without the router's scroll; once the new ticket has rendered
  // (the route change has committed, then one frame), close the panel
  // (toTop keeps the page at the top when the lock is released). The scroll
  // and the new ticket's render land in separate frames: in iOS Safari,
  // the two in back-to-back frames left the header's logo and wordmark
  // (and the panel's list) unpainted for a frame. From 1200px the queue is
  // a pane and nothing covers the page, so the router scrolls as usual.
  const open = (ticketId: string) => {
    if (!queueOpen) {
      router.push(`/tickets/${ticketId}`);
      return;
    }
    if (ticketId === id) {
      setQueueOpen(false);
      return;
    }
    if (pending.current) clearTimeout(pending.current.timer);
    // If the ticket is slow to open, don't hold the panel open: close it
    // after 3 seconds (the page is already at the top); the ticket opens
    // there when it arrives.
    const timer = window.setTimeout(() => setQueueOpen(false), 3000);
    pending.current = { id: ticketId, timer, late: false };
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    requestAnimationFrame(() => router.push(`/tickets/${ticketId}`, { scroll: false }));
  };
  useEffect(() => {
    const pick = pending.current;
    if (pick?.id !== id) return;
    clearTimeout(pick.timer);
    pending.current = null;
    if (pick.late) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      return;
    }
    const frame = requestAnimationFrame(() => setQueue({ open: false, toTop: true }));
    return () => cancelAnimationFrame(frame);
  }, [id]);

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

  // Below 1200px: whether the panes have passed under the fixed header's
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
      const fixed = getComputedStyle(header).position === "fixed";
      setStuck(fixed && pane.getBoundingClientRect().top < header.getBoundingClientRect().bottom + 12);
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
      {/* The grid row's placeholder; below 1200px the header bar inside is fixed. */}
      <div className={styles.header}>
        <div
          ref={headerRef}
          className={styles.headerBar}
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
      </div>
      <h1 className="visually-hidden">Inbox</h1>

      <div className={styles.queuePane}>
        <Pane
          title="Queue"
          count={tickets.length}
          action={<NewTicketButton onClick={() => setNewTicketOpen(true)} />}
          inset="list"
        >
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
          count={tickets.length}
          action={<NewTicketButton onClick={() => setQueueView("new-ticket")} />}
          id={queueId}
          button={queueButton}
          onOpened={centerCurrent}
          scrollTopOnClose={queue.toTop}
          subview={{
            open: queueView === "new-ticket",
            title: "New ticket",
            backLabel: "Back to queue",
            onBack: () => setQueueView("queue"),
            narrowTo: 520,
            children: <NewTicketForm key={formKey} variant="panel" />,
          }}
          // Closed from either view: back to the queue, and the form is cleared.
          onClosed={() => {
            setQueueView("queue");
            clearForm();
          }}
        >
          <QueueList currentId={id} onOpen={open} />
        </HeaderPanel>
      </div>

      <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen} title="New ticket" onClosed={clearForm}>
        <NewTicketForm key={formKey} variant="dialog" />
      </Dialog>
    </main>
  );
}

/** The queue header's action: opens the New ticket form (a dialog from 1200px, the panel's New ticket view below). */
function NewTicketButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="small" icon="plus" onClick={onClick}>
      New ticket
    </Button>
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

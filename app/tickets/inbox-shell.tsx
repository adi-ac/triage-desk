"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AppHeader, Button, Dialog, HeaderPanel, HeaderPanelButton, NewTicketForm, Pane } from "@/components/ui";
import { pickSample, sampleEmails } from "@/fixtures/sample-emails";
import { addTicket, type NewTicket } from "./added-tickets";
import { InboxProvider, useInbox } from "./inbox-state";
import { QueueList } from "./queue-list";
import { revealQueueRow } from "./queue-scroll";
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
  const inbox = useInbox();
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
  // The form is cleared (remounted with a new key) when either closes; in
  // the panel, Back clears it too (HeaderPanel remounts its subview).
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [queueView, setQueueView] = useState<"queue" | "new-ticket">("queue");
  const [formKey, setFormKey] = useState(0);
  const clearForm = () => setFormKey((k) => k + 1);

  // The sample email the form's placeholders show: picked at random each
  // time the form opens, never the one picked last. Clearing the form
  // keeps it; "Use a sample email" moves on to the next when Customer name
  // already has text.
  const [sample, setSample] = useState<number | null>(null);
  const pick = () => {
    const next = pickSample(sample);
    setSample(next);
    return sampleEmails[next];
  };
  const openNewTicket = (where: "dialog" | "panel") => {
    pick();
    if (where === "dialog") setNewTicketOpen(true);
    else setQueueView("new-ticket");
  };

  // Add and triage: the ticket goes at the top of Needs review, selected,
  // while the AI triages it. The form closes the way it always does: the
  // Dialog closes (focus back to New ticket); the queue panel closes as when
  // a ticket is picked (focus back to the queue's button). The new row is
  // brought into view in the desktop queue once it has opened.
  const justAdded = useRef<string | null>(null);
  const add = (input: NewTicket) => {
    const ticket = addTicket(input);
    inbox.triage(ticket.id);
    justAdded.current = ticket.id;
    if (newTicketOpen) {
      setNewTicketOpen(false);
      router.push(`/tickets/${ticket.id}`);
    } else {
      open(ticket.id);
    }
  };
  useEffect(() => {
    if (justAdded.current !== id) return;
    justAdded.current = null;
    revealQueueRow(id, "nearest", false);
  }, [id]);

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
      // The first pane on screen, found by Pane's own marker, never by
      // position among the wrapper's children: those include helpers that
      // aren't panes (the visually hidden status line, absolutely placed at
      // the top, which read as stuck at scrollY 0), and Next keeps recently
      // visited pages mounted but hidden (no rects).
      const pane = [...(ticketRef.current?.querySelectorAll("[data-pane]") ?? [])].find(
        (el) => el.getClientRects().length > 0,
      );
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
      {/* The first Tab stop: past the header and the queue to the Triage
          pane (on phones, past the email too). Hidden until focused. */}
      <a href="#triage" className={`text-small ${styles.skip}`} onClick={skipToTriage}>
        Skip to triage
      </a>
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
          count={inbox.tickets.length}
          action={<NewTicketButton onClick={() => openNewTicket("dialog")} />}
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
          count={inbox.tickets.length}
          action={<NewTicketButton onClick={() => openNewTicket("panel")} />}
          id={queueId}
          button={queueButton}
          onOpened={centerCurrent}
          scrollTopOnClose={queue.toTop}
          subview={{
            open: queueView === "new-ticket",
            title: "New ticket",
            backLabel: "Back to queue",
            onBack: () => setQueueView("queue"),
            children: (
              <NewTicketForm
                key={formKey}
                variant="panel"
                sample={sampleEmails[sample ?? 0]}
                onNextSample={pick}
                onAdd={add}
              />
            ),
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
        <NewTicketForm
          key={formKey}
          variant="dialog"
          sample={sampleEmails[sample ?? 0]}
          onNextSample={pick}
          onAdd={add}
        />
      </Dialog>
    </main>
  );
}

/**
 * The inbox's frame before the ticket ID is known (the App Shell for an ID
 * that isn't prerendered): the header row and the panes, empty, in the same
 * grid, so nothing moves when the inbox renders into it.
 */
export function InboxShellFallback() {
  return (
    <main className={styles.shell} aria-busy>
      <div className={styles.header}>
        <div className={styles.headerBar}>
          <AppHeader actions={<span className={styles.navSlot} />} />
        </div>
      </div>
      <h1 className="visually-hidden">Inbox</h1>
      <div className={styles.queuePane}>
        <Pane title="Queue" inset="list" />
      </div>
      <div className={styles.ticket}>
        <Pane title="Email" />
        <Pane title="Triage" />
      </div>
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

/**
 * "Skip to triage": focus the Triage pane on screen (Next keeps recently
 * visited pages mounted but hidden, so its ID can be there twice) and bring
 * its top into view, clear of the fixed header below 1200px (its scroll
 * margin). Without script the link still jumps to the first #triage.
 */
function skipToTriage(e: MouseEvent<HTMLAnchorElement>) {
  const pane = [...document.querySelectorAll<HTMLElement>('[id="triage"]')].find((el) => el.getClientRects().length > 0);
  if (!pane) return;
  e.preventDefault();
  pane.focus({ preventScroll: true });
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  pane.scrollIntoView({ block: "start", behavior: reduced ? "instant" : "smooth" });
}

/** The panel opens with the current ticket scrolled to the middle of its list. */
function centerCurrent(scroller: HTMLDivElement) {
  const item = scroller.querySelector("[aria-current]");
  if (!item) return;
  const list = scroller.getBoundingClientRect();
  const row = item.getBoundingClientRect();
  scroller.scrollTop += row.top - list.top - (list.height - row.height) / 2;
}

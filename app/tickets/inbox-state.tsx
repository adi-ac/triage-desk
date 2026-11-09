"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
import { tickets, type Ticket } from "@/fixtures/tickets";
import { orderQueue, undecided, type FieldDecisions, type Queue } from "@/lib/queue";
import type { Category, NotARequestSuggestion, Suggestion, TriageSuggestion, Urgency } from "@/lib/suggestion";
import { triageAdded, triageAddedAnyway, useAddedTickets, type AddedTicket } from "./added-tickets";
import { revealQueueRow } from "./queue-scroll";

/** One activity row a person or Claude added while the page was open. */
export type ActivityRow = { id: number; actor: "ai" | "human"; name?: string; at: string; text: string };

export type TicketState = {
  category: Category | null;
  urgency: Urgency | null;
  draft: string;
  draftEdited: boolean;
  /** When a person sent the reply, ISO 8601. */
  sentAt: string | null;
  /** When a person kept "Not a request", closing the ticket without a reply. */
  closedAt: string | null;
  /** A person chose "Triage anyway" on a "Not a request" suggestion. */
  triagedAnyway: boolean;
  activity: ActivityRow[];
};

type InboxState = {
  /** Every ticket: the tab's added ones (newest first), then the fixtures. */
  tickets: readonly Ticket[];
  ticketFor: (id: string) => Ticket | undefined;
  /** An added ticket's live triage; undefined for the fixtures. */
  addedFor: (id: string) => AddedTicket | undefined;
  /** False until the tab's added tickets have been read (the server, and the render that hydrates). */
  addedLoaded: boolean;
  /** The AI's suggestion, recorded or live, before any "Triage anyway". */
  suggestionOf: (id: string) => Suggestion | undefined;
  stateFor: (id: string) => TicketState;
  update: (id: string, change: (state: TicketState) => TicketState) => void;
  decisionsFor: (id: string) => FieldDecisions;
  /** The suggestion in effect: after "Triage anyway", the normal suggestion Claude gave instead. */
  effectiveFor: (id: string) => Suggestion | undefined;
  /** When a ticket was dealt with: sent by a person or a rule, or closed; null if it hasn't been. */
  doneAtFor: (id: string) => string | null;
  /**
   * The queue as it stood when the open ticket was opened. It re-sorts only
   * when a different ticket opens (or on reload), so a row never moves out
   * from under the person working on it.
   */
  queue: Queue;
  /**
   * Moves an added ticket's row to the top of Probably no action, when its
   * "not a request" answer arrives: the one move made while a ticket is open.
   */
  moveToNoAction: (id: string) => void;
  /**
   * Triages an added ticket with the live model (on Add and triage, and Try
   * again). A "not a request" answer moves its row to Probably no action,
   * and the queue scrolls it to the middle if it's the open ticket.
   */
  triage: (id: string) => void;
  /** "Triage anyway" on an added ticket: asks the live model for a normal suggestion. */
  triageAnyway: (id: string) => void;
};

export const modelRowText = (s: TriageSuggestion) =>
  `suggested ${s.category.value} and ${s.urgency.value} urgency, and drafted a reply`;

export const reasonText = (s: NotARequestSuggestion) => `suggested this isn't a request (${s.reason})`;

const Inbox = createContext<InboxState | null>(null);

/** A ticket's state before anyone acts on it, given its suggestion. */
export const initialFor = (s: Suggestion | undefined): TicketState => {
  return {
    category: null,
    urgency: null,
    draft: s?.kind === "triage" ? s.draft : "",
    draftEdited: false,
    sentAt: null,
    closedAt: null,
    triagedAnyway: false,
    activity: [],
  };
};

/** Keeps what a person did on each ticket while they move around the inbox. */
export function InboxProvider({ currentId, children }: { currentId: string; children: ReactNode }) {
  const { added, loaded } = useAddedTickets();
  const all: readonly Ticket[] = added.length ? [...added.map((a) => a.ticket), ...tickets] : tickets;
  const addedFor = (id: string) => added.find((a) => a.ticket.id === id);
  const suggestionOf = (id: string) => suggestionFor(id) ?? addedFor(id)?.suggestion ?? undefined;

  const [states, setStates] = useState<Record<string, TicketState>>({});
  const initial = (id: string) => initialFor(suggestionOf(id));
  const stateFor = (id: string) => states[id] ?? initial(id);
  const decisionsFor = (id: string): FieldDecisions => {
    const s = stateFor(id);
    return s.category || s.urgency ? { category: s.category, urgency: s.urgency } : undecided;
  };
  const effectiveFor = (id: string): Suggestion | undefined => {
    const s = suggestionOf(id);
    const anyway = stateFor(id).triagedAnyway || addedFor(id)?.anyway?.status === "done";
    return s?.kind === "not-a-request" && anyway && s.triageAnyway ? s.triageAnyway : s;
  };
  const doneAtFor = (id: string) => ruleSendFor(id)?.sentAt ?? stateFor(id).sentAt ?? stateFor(id).closedAt;

  // Re-sort only when a different ticket opens: computed during render the
  // first time each ticket is current, then held. Also when the tab's added
  // tickets come or go (read after a reload, or one just added), so a new
  // row is never missing.
  const key = `${currentId} ${added.map((a) => a.ticket.id).join(",")}`;
  const [snapshot, setSnapshot] = useState<{ key: string; queue: Queue } | null>(null);
  let queue: Queue;
  if (snapshot && snapshot.key === key) {
    queue = snapshot.queue;
  } else {
    queue = orderQueue(all, effectiveFor, decisionsFor, doneAtFor);
    // An added ticket still waiting for the AI goes at the top of Needs
    // review, newest first, where the person will look for it; so does the
    // open one if it has no answer (it failed, even before it opened, as an
    // over-the-limit answer can). Others without an answer sort into Not
    // triaged yet.
    const waiting = added
      .filter((a) => !doneAtFor(a.ticket.id) && !a.suggestion)
      .filter((a) => a.triage.status === "triaging" || a.ticket.id === currentId)
      .map((a) => a.ticket);
    if (waiting.length) {
      const out = (list: Ticket[]) => list.filter((t) => !waiting.includes(t));
      queue = { ...queue, needsReview: [...waiting, ...out(queue.needsReview)], untriaged: out(queue.untriaged) };
    }
    setSnapshot({ key, queue });
  }

  const moveToNoAction = (id: string) =>
    setSnapshot((snap) => {
      if (!snap) return snap;
      const q = snap.queue;
      const ticket = [...q.needsReview, ...q.untriaged].find((t) => t.id === id);
      if (!ticket) return snap;
      const out = (list: Ticket[]) => list.filter((t) => t.id !== id);
      return {
        ...snap,
        queue: {
          ...q,
          needsReview: out(q.needsReview),
          untriaged: out(q.untriaged),
          noAction: [ticket, ...out(q.noAction)],
        },
      };
    });

  const update = (id: string, change: (state: TicketState) => TicketState) =>
    setStates((current) => ({ ...current, [id]: change(current[id] ?? initial(id)) }));

  const triage = (id: string) =>
    void triageAdded(id).then((s) => {
      if (s?.kind !== "not-a-request") return;
      // Rendered at once, so the row is in its new place before it's scrolled to.
      flushSync(() => moveToNoAction(id));
      revealQueueRow(id, "center", true);
    });

  const triageAnyway = (id: string) => {
    update(id, (s) => ({ ...s, activity: [...s.activity, personRow("asked the AI to triage it anyway")] }));
    void triageAddedAnyway(id).then((anyway) => {
      if (!anyway) return;
      update(id, (s) => ({
        ...s,
        triagedAnyway: true,
        draft: anyway.draft,
        activity: [...s.activity, modelRow(modelRowText(anyway))],
      }));
    });
  };

  const value: InboxState = {
    tickets: all,
    ticketFor: (id) => all.find((t) => t.id === id),
    addedFor,
    addedLoaded: loaded,
    suggestionOf,
    stateFor,
    update,
    decisionsFor,
    effectiveFor,
    doneAtFor,
    queue,
    moveToNoAction,
    triage,
    triageAnyway,
  };
  return <Inbox value={value}>{children}</Inbox>;
}

export function useInbox() {
  const inbox = use(Inbox);
  if (!inbox) throw new Error("useInbox needs an InboxProvider");
  return inbox;
}

let nextRowId = 0;

/** Claude's suggestion arriving now, such as the answer to "Triage anyway". */
export const modelRow = (text: string): ActivityRow => ({
  id: nextRowId++,
  actor: "ai",
  at: new Date().toISOString(),
  text,
});

/** A person's action, now. */
export const personRow = (text: string): ActivityRow => ({
  id: nextRowId++,
  actor: "human",
  name: "You",
  at: new Date().toISOString(),
  text,
});

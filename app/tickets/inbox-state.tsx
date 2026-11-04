"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { ruleSendFor, suggestionFor } from "@/fixtures/suggestions";
import { tickets } from "@/fixtures/tickets";
import { orderQueue, undecided, type FieldDecisions, type Queue } from "@/lib/queue";
import type { Category, Urgency } from "@/lib/suggestion";

/** One activity row a person or Claude added while the page was open. */
export type ActivityRow = { id: number; actor: "ai" | "human"; name?: string; at: string; text: string };

export type TicketState = {
  category: Category | null;
  urgency: Urgency | null;
  draft: string;
  draftEdited: boolean;
  /** When a person sent the reply, ISO 8601. */
  sentAt: string | null;
  activity: ActivityRow[];
};

type InboxState = {
  stateFor: (id: string) => TicketState;
  update: (id: string, change: (state: TicketState) => TicketState) => void;
  decisionsFor: (id: string) => FieldDecisions;
  /** When a ticket was sent, by a person or a rule; null if it hasn't been. */
  sentAtFor: (id: string) => string | null;
  /**
   * The queue as it stood when the open ticket was opened. It re-sorts only
   * when a different ticket opens (or on reload), so a row never moves out
   * from under the person working on it.
   */
  queue: Queue;
};

const Inbox = createContext<InboxState | null>(null);

const initial = (id: string): TicketState => ({
  category: null,
  urgency: null,
  draft: suggestionFor(id)?.draft ?? "",
  draftEdited: false,
  sentAt: null,
  activity: [],
});

/** Keeps what a person did on each ticket while they move around the inbox. */
export function InboxProvider({ currentId, children }: { currentId: string; children: ReactNode }) {
  const [states, setStates] = useState<Record<string, TicketState>>({});
  const stateFor = (id: string) => states[id] ?? initial(id);
  const decisionsFor = (id: string): FieldDecisions => {
    const s = stateFor(id);
    return s.category || s.urgency ? { category: s.category, urgency: s.urgency } : undecided;
  };
  const sentAtFor = (id: string) => ruleSendFor(id)?.sentAt ?? stateFor(id).sentAt;

  // Re-sort only when a different ticket opens: computed during render the
  // first time each ticket is current, then held.
  const [snapshot, setSnapshot] = useState<{ forId: string; queue: Queue } | null>(null);
  let queue: Queue;
  if (snapshot && snapshot.forId === currentId) {
    queue = snapshot.queue;
  } else {
    queue = orderQueue(tickets, suggestionFor, decisionsFor, sentAtFor);
    setSnapshot({ forId: currentId, queue });
  }

  const value: InboxState = {
    stateFor,
    update: (id, change) => setStates((all) => ({ ...all, [id]: change(all[id] ?? initial(id)) })),
    decisionsFor,
    sentAtFor,
    queue,
  };
  return <Inbox value={value}>{children}</Inbox>;
}

export function useInbox() {
  const inbox = use(Inbox);
  if (!inbox) throw new Error("useInbox needs an InboxProvider");
  return inbox;
}

let nextRowId = 0;

/** A person's action, now. */
export const personRow = (text: string): ActivityRow => ({
  id: nextRowId++,
  actor: "human",
  name: "You",
  at: new Date().toISOString(),
  text,
});

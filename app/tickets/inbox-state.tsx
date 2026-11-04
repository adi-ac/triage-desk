"use client";

import { createContext, use, useState, type ReactNode } from "react";
import { suggestionFor } from "@/fixtures/suggestions";
import { undecided, type FieldDecisions } from "@/lib/queue";
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
export function InboxProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<string, TicketState>>({});
  const stateFor = (id: string) => states[id] ?? initial(id);
  const value: InboxState = {
    stateFor,
    update: (id, change) => setStates((all) => ({ ...all, [id]: change(all[id] ?? initial(id)) })),
    decisionsFor: (id) => {
      const s = stateFor(id);
      return s.category || s.urgency ? { category: s.category, urgency: s.urgency } : undecided;
    },
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

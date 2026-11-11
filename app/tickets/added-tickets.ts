/**
 * Tickets a visitor added with the New ticket form, and their live triage
 * (POST /api/triage). They live only in memory, for the life of the page:
 * switching tickets (pushState) keeps them and any triage still out, and a
 * reload or a new tab starts fresh with the fixtures alone (numbering again
 * from the first ID after them). Read them with useAddedTickets(); the
 * inbox state (inbox-state.tsx) merges them with the fixtures.
 *
 * The requests live here, outside React, so a triage keeps going while the
 * person opens other tickets.
 */

import { useSyncExternalStore } from "react";
import { tickets, type Ticket } from "@/fixtures/tickets";
import type { NotARequestSuggestion, Suggestion, TriageSuggestion } from "@/lib/suggestion";
import type { TriageError } from "@/lib/triage-request";

/** Why a live triage didn't come back. */
export type LiveFailure = Exclude<TriageError["error"], "invalid">;

export type LiveTriage =
  { status: "triaging" } | { status: "done" } | { status: "failed"; error: LiveFailure; resetsAt?: string };

export type AddedTicket = {
  ticket: Ticket;
  /** As typed; there's no Ledgerline account behind it. */
  company?: string;
  /** The AI's answer, once it's in. */
  suggestion: Suggestion | null;
  /** The first triage. */
  triage: LiveTriage;
  /** "Triage anyway" on a "not a request" answer; done once its suggestion is in. */
  anyway: LiveTriage | null;
};

export type NewTicket = { name: string; company?: string; subject?: string; message: string };

/** The server, and the render that hydrates: no page yet, so no added tickets to know of. */
const NOT_LOADED: readonly AddedTicket[] = Object.freeze([]);
/** A fresh page: none. */
let added: readonly AddedTicket[] = Object.freeze([]);
const listeners = new Set<() => void>();

// Earlier versions kept added tickets in sessionStorage; a visitor who had
// some saved starts clean.
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("triage-desk:added-tickets");
  } catch {
    // Storage blocked: nothing was saved there either.
  }
}

function current(): readonly AddedTicket[] {
  return typeof window === "undefined" ? NOT_LOADED : added;
}

function set(next: readonly AddedTicket[]) {
  added = next;
  listeners.forEach((l) => l());
}

function change(id: string, update: (a: AddedTicket) => AddedTicket) {
  set(current().map((a) => (a.ticket.id === id ? update(a) : a)));
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The page's added tickets, newest first; `loaded` is false on the server and in the render that hydrates. */
export function useAddedTickets(): { added: readonly AddedTicket[]; loaded: boolean } {
  const list = useSyncExternalStore(subscribe, current, () => NOT_LOADED);
  return { added: list, loaded: list !== NOT_LOADED };
}

export const findAdded = (id: string) => current().find((a) => a.ticket.id === id);

const number = (id: string) => Number(/^LL-(\d+)$/.exec(id)?.[1] ?? 0);
const lastFixture = Math.max(...tickets.map((t) => number(t.id)));

/**
 * Whether an ID could be an added ticket's (one after the fixtures). Such
 * an ID is never a 404: opened in a fresh page (a reload, a pasted link, or
 * Back or Forward into a new page) the ticket is gone, and the inbox
 * replaces the URL with the first screen's ticket.
 */
export const couldBeAdded = (id: string) => number(id) > lastFixture;

/** A fictional address: the first name at the company, on .example. */
function addressFor(name: string, company?: string) {
  const plain = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const first =
    plain(name)
      .split(/\s+/)[0]
      .replace(/[^a-z0-9]/g, "") || "customer";
  const domain =
    plain(company ?? "")
      .replace(/&/g, " ")
      .split(/[^a-z0-9]+/)
      .filter((w) => w && !["gmbh", "co", "ltd", "inc", "llc"].includes(w))
      .join("") || "mail";
  return `${first}@${domain}.example`;
}

/** Adds a ticket, with the next free LL- number after the fixtures and any added before it. */
export function addTicket(input: NewTicket): Ticket {
  const all = current();
  const next = Math.max(lastFixture, ...all.map((a) => number(a.ticket.id))) + 1;
  const ticket: Ticket = {
    id: `LL-${next}`,
    from: { name: input.name.trim(), email: addressFor(input.name, input.company) },
    account: null,
    receivedAt: new Date().toISOString(),
    subject: input.subject?.trim() ?? "",
    body: input.message.trim(),
  };
  const company = input.company?.trim() || undefined;
  set([{ ticket, company, suggestion: null, triage: { status: "triaging" }, anyway: null }, ...all]);
  return ticket;
}

/** Requests out now, by ticket ID and kind, so a second press never sends a second request. */
const inFlight = new Set<string>();

type Outcome = { ok: true; suggestion: Suggestion } | { ok: false; error: LiveFailure; resetsAt?: string };

async function request(a: AddedTicket, triageAnyway: boolean): Promise<Outcome> {
  const { ticket } = a;
  try {
    const response = await fetch("/api/triage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: ticket.from.name,
        company: a.company,
        subject: ticket.subject || undefined,
        message: ticket.body,
        ...(triageAnyway ? { triageAnyway: true } : {}),
      }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body?.kind) return { ok: true, suggestion: { ...body, ticketId: ticket.id } as Suggestion };
    if (response.status === 429 && (body?.error === "visitor-limit" || body?.error === "daily-cap")) {
      return { ok: false, error: body.error, resetsAt: body.resetsAt };
    }
    if (response.status === 503) return { ok: false, error: "unavailable" };
    return { ok: false, error: "model" };
  } catch {
    // Offline, or the request died: offer another try.
    return { ok: false, error: "model" };
  }
}

/**
 * Asks the AI to triage an added ticket (again, after a failure). Resolves
 * with the suggestion, or null if it failed (the failure is in the store).
 */
export async function triageAdded(id: string): Promise<Suggestion | null> {
  const a = findAdded(id);
  if (!a || inFlight.has(`${id} triage`)) return null;
  inFlight.add(`${id} triage`);
  change(id, (x) => ({ ...x, triage: { status: "triaging" } }));
  const outcome = await request(a, false);
  inFlight.delete(`${id} triage`);
  if (!outcome.ok) {
    change(id, (x) => ({ ...x, triage: { status: "failed", error: outcome.error, resetsAt: outcome.resetsAt } }));
    return null;
  }
  change(id, (x) => ({ ...x, suggestion: outcome.suggestion, triage: { status: "done" } }));
  return outcome.suggestion;
}

/** "Triage anyway" on an added ticket's "not a request" answer: the normal suggestion, or null if it failed. */
export async function triageAddedAnyway(id: string): Promise<TriageSuggestion | null> {
  const a = findAdded(id);
  if (!a || a.suggestion?.kind !== "not-a-request" || inFlight.has(`${id} anyway`)) return null;
  inFlight.add(`${id} anyway`);
  change(id, (x) => ({ ...x, anyway: { status: "triaging" } }));
  const outcome = await request(a, true);
  inFlight.delete(`${id} anyway`);
  if (!outcome.ok || outcome.suggestion.kind !== "triage") {
    const failure: { error: LiveFailure; resetsAt?: string } = outcome.ok ? { error: "model" } : outcome;
    change(id, (x) => ({ ...x, anyway: { status: "failed", error: failure.error, resetsAt: failure.resetsAt } }));
    return null;
  }
  const anyway = outcome.suggestion;
  change(id, (x) => ({
    ...x,
    suggestion: { ...(x.suggestion as NotARequestSuggestion), triageAnyway: anyway },
    anyway: { status: "done" },
  }));
  return anyway;
}

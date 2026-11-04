import type { Ticket } from "@/fixtures/tickets";
import type { Category, Suggestion, TriageSuggestion, Urgency } from "./suggestion";

/** What a person has decided for a ticket's fields; null while still the model's suggestion. */
export type FieldDecisions = { category: Category | null; urgency: Urgency | null };

export const undecided: FieldDecisions = { category: null, urgency: null };

const highStakesCategories: readonly Category[] = ["Billing", "Cancellation risk"];

/**
 * High stakes: the category is Billing or Cancellation risk, or the urgency
 * is Urgent, counting the runner-up as well as the top pick. Once a person
 * decides a field, only their value counts. When Claude is unsure, assume
 * the higher stakes, so a likely cancellation can't sink just because the
 * top guess was How-to.
 */
export function isHighStakes(s: TriageSuggestion, d: FieldDecisions): boolean {
  const categories = d.category ? [d.category] : [s.category.value, s.category.runnerUp?.value];
  const urgencies = d.urgency ? [d.urgency] : [s.urgency.value, s.urgency.runnerUp?.value];
  return (
    categories.some((c) => c !== undefined && highStakesCategories.includes(c)) ||
    urgencies.includes("Urgent" satisfies Urgency)
  );
}

/** The lowest confidence of any field nobody has decided; 1 when every field is decided. */
export function leastSure(s: TriageSuggestion, d: FieldDecisions): number {
  const open = [d.category ? null : s.category.confidence, d.urgency ? null : s.urgency.confidence].filter(
    (c): c is number => c !== null,
  );
  return open.length ? Math.min(...open) : 1;
}

const newestFirst = (a: Ticket, b: Ticket) => b.receivedAt.localeCompare(a.receivedAt);

export type Queue = { needsReview: Ticket[]; noAction: Ticket[]; untriaged: Ticket[]; sent: Ticket[] };

/**
 * The queue, in four groups. Needs review: a triage suggestion not yet sent,
 * high stakes before normal, least sure first within each. Probably no
 * action: Claude suggests it isn't a request, and nobody has closed it or
 * triaged it anyway; newest first. Not triaged yet: no model output, newest
 * first. Sent: sent by a person or a rule, or closed without a reply; most
 * recent first.
 *
 * suggestionFor returns the suggestion in effect: after "Triage anyway",
 * the normal suggestion Claude gave instead.
 */
export function orderQueue(
  tickets: readonly Ticket[],
  suggestionFor: (id: string) => Suggestion | undefined,
  decisionsFor: (id: string) => FieldDecisions,
  doneAtFor: (id: string) => string | null,
): Queue {
  const open = tickets.filter((t) => !doneAtFor(t.id));
  const untriaged = open.filter((t) => !suggestionFor(t.id)).sort(newestFirst);
  const noAction = open.filter((t) => suggestionFor(t.id)?.kind === "not-a-request").sort(newestFirst);
  const sent = tickets.filter((t) => doneAtFor(t.id)).sort((a, b) => doneAtFor(b.id)!.localeCompare(doneAtFor(a.id)!));
  const needsReview = open.filter((t) => suggestionFor(t.id)?.kind === "triage");
  const key = (t: Ticket) => {
    const s = suggestionFor(t.id) as TriageSuggestion;
    const d = decisionsFor(t.id);
    return { high: isHighStakes(s, d), sure: leastSure(s, d) };
  };
  needsReview.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka.high !== kb.high) return ka.high ? -1 : 1;
    if (ka.sure !== kb.sure) return ka.sure - kb.sure;
    return newestFirst(a, b);
  });
  return { needsReview, noAction, untriaged, sent };
}

/** The queue top to bottom, for "Next ticket". */
export const flatQueue = (q: Queue) => [...q.needsReview, ...q.noAction, ...q.untriaged, ...q.sent];

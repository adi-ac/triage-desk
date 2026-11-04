import type { Ticket } from "@/fixtures/tickets";
import type { Category, Suggestion, Urgency } from "./suggestion";

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
export function isHighStakes(s: Suggestion, d: FieldDecisions): boolean {
  const categories = d.category ? [d.category] : [s.category.value, s.category.runnerUp?.value];
  const urgencies = d.urgency ? [d.urgency] : [s.urgency.value, s.urgency.runnerUp?.value];
  return (
    categories.some((c) => c !== undefined && highStakesCategories.includes(c)) ||
    urgencies.includes("Urgent" satisfies Urgency)
  );
}

/** The lowest confidence of any field nobody has decided; 1 when every field is decided. */
export function leastSure(s: Suggestion, d: FieldDecisions): number {
  const open = [d.category ? null : s.category.confidence, d.urgency ? null : s.urgency.confidence].filter(
    (c): c is number => c !== null,
  );
  return open.length ? Math.min(...open) : 1;
}

const newestFirst = (a: Ticket, b: Ticket) => b.receivedAt.localeCompare(a.receivedAt);

/**
 * The queue: triaged tickets by stakes first (high, then normal), least sure
 * first within each; then tickets with no model output, newest first.
 */
export function orderQueue(
  tickets: readonly Ticket[],
  suggestionFor: (id: string) => Suggestion | undefined,
  decisionsFor: (id: string) => FieldDecisions,
): { triaged: Ticket[]; untriaged: Ticket[] } {
  const triaged = tickets.filter((t) => suggestionFor(t.id));
  const untriaged = tickets.filter((t) => !suggestionFor(t.id)).sort(newestFirst);
  const key = (t: Ticket) => {
    const s = suggestionFor(t.id)!;
    const d = decisionsFor(t.id);
    return { high: isHighStakes(s, d), sure: leastSure(s, d) };
  };
  triaged.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka.high !== kb.high) return ka.high ? -1 : 1;
    if (ka.sure !== kb.sure) return ka.sure - kb.sure;
    return newestFirst(a, b);
  });
  return { triaged, untriaged };
}

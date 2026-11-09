import type { Ticket } from "@/fixtures/tickets";
import { confidenceThresholds, toPercent } from "./confidence";
import type { Category, SuggestedField, Suggestion, TriageSuggestion, Urgency } from "./suggestion";

/** What a person has decided for a ticket's fields; null while still the model's suggestion. */
export type FieldDecisions = { category: Category | null; urgency: Urgency | null };

export const undecided: FieldDecisions = { category: null, urgency: null };

const highStakesCategories: readonly Category[] = ["Billing", "Cancellation risk"];

/**
 * The values that count toward stakes for one field: a person's decision if
 * there is one; otherwise the top pick, plus the runner-up only when it's
 * within the 15-point margin (the same test as "unsure"). A far-behind
 * runner-up, such as Cancellation risk at 10% behind Bug at 70%, doesn't count.
 */
function stakesValues<T extends string>(field: SuggestedField<T>, decided: T | null): T[] {
  if (decided) return [decided];
  const r = field.runnerUp;
  const close = r && toPercent(field.confidence) - toPercent(r.confidence) < confidenceThresholds.margin;
  return close ? [field.value, r.value] : [field.value];
}

/**
 * High stakes: the category is Billing or Cancellation risk, or the urgency
 * is Urgent, counting a close runner-up as well as the top pick. Once a
 * person decides a field, only their value counts. When Claude is unsure
 * between two values, assume the higher stakes, so a likely cancellation
 * can't sink just because the top guess was How-to.
 */
export function isHighStakes(s: TriageSuggestion, d: FieldDecisions): boolean {
  const categories = stakesValues(s.category, d.category);
  const urgencies = stakesValues(s.urgency, d.urgency);
  return (
    categories.some((c) => highStakesCategories.includes(c)) ||
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
 *
 * leaders: a documented demo exception (fixtures `queueLeaders`). Those in
 * Needs review that nobody has decided a field on go first, in the order
 * given; once a person decides a field, the ticket sorts by the rule.
 */
export function orderQueue(
  tickets: readonly Ticket[],
  suggestionFor: (id: string) => Suggestion | undefined,
  decisionsFor: (id: string) => FieldDecisions,
  doneAtFor: (id: string) => string | null,
  leaders: readonly string[] = [],
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
  const undecidedLeaders = leaders
    .map((id) => needsReview.find((t) => t.id === id))
    .filter((t): t is Ticket => !!t && !decisionsFor(t.id).category && !decisionsFor(t.id).urgency);
  const rest = needsReview.filter((t) => !undecidedLeaders.includes(t));
  return { needsReview: [...undecidedLeaders, ...rest], noAction, untriaged, sent };
}

/** The queue top to bottom, for "Next ticket". */
export const flatQueue = (q: Queue) => [...q.needsReview, ...q.noAction, ...q.untriaged, ...q.sent];

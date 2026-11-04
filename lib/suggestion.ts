/**
 * The shape of model output, shared by fixtures, screens and components.
 * Fixtures hold the data; nothing here is an answer.
 */

/** Every category a ticket can have. The full list behind FieldReview's "Other…". */
export const categories = ["How-to", "Billing", "Bug", "Feature request", "Cancellation risk"] as const;
export type Category = (typeof categories)[number];

/** Every urgency, highest first. The same four levels as Severity. */
export const urgencies = ["Urgent", "High", "Normal", "Low"] as const;
export type Urgency = (typeof urgencies)[number];

/** Where model output came from. Shown with OutputSource (DESIGN.md, rule 6). */
export type OutputSourceKind = "recorded" | "live" | "hand-written";

/** Which suggestion a quote backs. */
export type EvidenceSupports = "category" | "urgency";

/** One field as the model suggested it. Confidences are 0–1. */
export type SuggestedField<T extends string = string> = {
  value: T;
  confidence: number;
  /** The next most likely value. Missing when nothing else came close. */
  runnerUp?: { value: T; confidence: number };
};

export type Evidence = {
  /** Word for word from the email. Screens drop any quote that doesn't match. */
  quote: string;
  supports: EvidenceSupports;
};

/** A reply a team rule sent without review. Not model output: the rule acted on it. */
export type RuleSend = {
  ticketId: string;
  /** The rule's name, e.g. "How-to questions". */
  rule: string;
  /** What the rule requires, in words: "How-to, confidence 90% or higher". */
  condition: string;
  /** ISO 8601. */
  sentAt: string;
};

export type Suggestion = {
  ticketId: string;
  source: OutputSourceKind;
  /** When the model made the suggestion, ISO 8601. */
  suggestedAt: string;
  category: SuggestedField<Category>;
  urgency: SuggestedField<Urgency>;
  evidence: Evidence[];
  /** Facts the model can't know are left as [placeholders], which block Approve. */
  draft: string;
};

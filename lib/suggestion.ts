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

/** Where model output came from. Kept in the data, not shown in the interface (DESIGN.md, rule 6). */
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

/** A quote from the customer's email that backs the category or urgency pick. */
export type EmailEvidence = {
  /** Word for word from the email. Screens drop any quote that doesn't match. */
  quote: string;
  supports: EvidenceSupports;
  article?: never;
};

/**
 * A sentence from a help-center article (fixtures/help-center.ts) that the
 * draft relies on. Drafts are grounded in the help center, not guessed.
 */
export type ArticleEvidence = {
  /** Word for word from the article. */
  quote: string;
  supports: "draft";
  /** The article's title. */
  article: string;
};

export type Evidence = EmailEvidence | ArticleEvidence;

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

/** Why an email isn't a request: nothing for support to answer. */
export const notARequestReasons = ["auto-reply", "empty", "misdirected", "nothing to do"] as const;
export type NotARequestReason = (typeof notARequestReasons)[number];

type SuggestionBase = {
  ticketId: string;
  source: OutputSourceKind;
  /** When the model made the suggestion, ISO 8601. For recorded output, the recording date. */
  suggestedAt: string;
  /** The model that produced it, e.g. "claude-sonnet-5-5". Set on recorded and live output. */
  model?: string;
  /** Which version of the prompt produced it (a hash of the prompt and schema). Set on recorded output. */
  promptVersion?: string;
  /** Something the support agent should know or do, from Claude. Shown as "AI note" (the interface never names the model). */
  agentNote?: string;
};

/** A normal suggestion: category, urgency, evidence and a draft reply. */
export type TriageSuggestion = SuggestionBase & {
  kind: "triage";
  category: SuggestedField<Category>;
  urgency: SuggestedField<Urgency>;
  evidence: Evidence[];
  /**
   * The reply to the customer. Facts Claude can't know (dates, amounts,
   * names, account details) are left as [placeholders], which block Approve.
   * Never advice to the support agent: that goes in agentNote.
   */
  draft: string;
};

/**
 * Claude's suggestion that the email isn't a request at all (an auto-reply,
 * an empty message, one sent to the wrong place, or nothing to do), instead
 * of forcing a category on it. No urgency and no draft. Still a suggestion:
 * a person keeps it (closing the ticket without a reply) or triages anyway.
 */
export type NotARequestSuggestion = SuggestionBase & {
  kind: "not-a-request";
  reason: NotARequestReason;
  /** One short sentence saying why, for the person reviewing it. */
  explanation: string;
  /** Quotes from the email that show it. */
  evidence: EmailEvidence[];
  /**
   * The normal suggestion "Triage anyway" shows. Recorded alongside, so the
   * demo works without a live call; live mode asks Claude at that moment.
   */
  triageAnyway?: TriageSuggestion;
};

export type Suggestion = TriageSuggestion | NotARequestSuggestion;

import type { EmailEvidence, Evidence, EvidenceSupports } from "./suggestion";

/** The email's paragraphs. A quote can't cross one, so matching is per paragraph. */
export const paragraphsOf = (body: string) => body.split("\n\n");

const fromEmail = (e: Evidence): e is EmailEvidence => e.supports !== "draft";

/**
 * The email quotes that appear in the email word for word, in its subject
 * line or body, in the model's order. Anything else is dropped: never show
 * evidence the email doesn't contain. Article evidence (what the draft
 * relies on) is left out.
 */
export function matchEvidence(body: string, evidence: readonly Evidence[], subject = ""): EmailEvidence[] {
  const paragraphs = [subject, ...paragraphsOf(body)].filter(Boolean);
  return evidence.filter(fromEmail).filter((e) => e.quote.trim() !== "" && paragraphs.some((p) => p.includes(e.quote)));
}

/** A quote and every field it supports; one quote can back both the category and the urgency. */
export type Segment = { text: string; supports?: EvidenceSupports[] };

/**
 * One paragraph split into plain text and quotes, earliest quote first; the
 * longer quote wins when two start together. A quote cited for several
 * fields is one segment listing them all, so it's marked once. Only pass
 * matched evidence.
 */
export function segmentParagraph(paragraph: string, evidence: readonly EmailEvidence[]): Segment[] {
  const byQuote = new Map<string, EvidenceSupports[]>();
  for (const e of evidence) {
    if (e.quote === "") continue;
    const supports = byQuote.get(e.quote) ?? [];
    if (!supports.includes(e.supports)) supports.push(e.supports);
    byQuote.set(e.quote, supports);
  }
  const segments: Segment[] = [];
  let rest = paragraph;
  while (rest) {
    const next = [...byQuote]
      .map(([quote, supports]) => ({ quote, supports, at: rest.indexOf(quote) }))
      .filter((e) => e.at >= 0)
      .sort((a, b) => a.at - b.at || b.quote.length - a.quote.length)[0];
    if (!next) {
      segments.push({ text: rest });
      break;
    }
    if (next.at > 0) segments.push({ text: rest.slice(0, next.at) });
    segments.push({ text: next.quote, supports: next.supports });
    rest = rest.slice(next.at + next.quote.length);
  }
  return segments;
}

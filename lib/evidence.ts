import type { Evidence, EvidenceSupports } from "./suggestion";

/** The email's paragraphs. A quote can't cross one, so matching is per paragraph. */
export const paragraphsOf = (body: string) => body.split("\n\n");

/**
 * The quotes that appear in the email word for word, in the model's order.
 * Anything else is dropped: never show evidence the email doesn't contain.
 */
export function matchEvidence(body: string, evidence: readonly Evidence[]): Evidence[] {
  const paragraphs = paragraphsOf(body);
  return evidence.filter((e) => e.quote.trim() !== "" && paragraphs.some((p) => p.includes(e.quote)));
}

export type Segment = { text: string; supports?: EvidenceSupports };

/**
 * One paragraph split into plain text and quotes, earliest quote first; the
 * longer quote wins when two start together. Only pass matched evidence.
 */
export function segmentParagraph(paragraph: string, evidence: readonly Evidence[]): Segment[] {
  const segments: Segment[] = [];
  let rest = paragraph;
  while (rest) {
    const next = evidence
      .map((e) => ({ ...e, at: rest.indexOf(e.quote) }))
      .filter((e) => e.at >= 0 && e.quote !== "")
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

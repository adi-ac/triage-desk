"use client";

import { useEffect, useRef, type ComponentProps, type ReactNode } from "react";
import { matchEvidence, paragraphsOf, segmentParagraph } from "@/lib/evidence";
import type { EmailEvidence, Evidence } from "@/lib/suggestion";
import { EvidenceMark } from "./evidence-mark";
import styles from "./email-body.module.css";

export type EmailBodyProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** The subject line, shown as the email's heading (an h3) and marked like the body. */
  subject?: string;
  /** The email as received; paragraphs are split on blank lines, line breaks kept. */
  body: string;
  /** The model's quotes. Any that don't match the subject or body word for word are dropped. */
  evidence?: readonly Evidence[];
  /** The quote whose evidence item is hovered or focused: marked solid and scrolled into view. */
  activeQuote?: string | null;
  /** Shown between the subject and the body, such as the sender. */
  meta?: ReactNode;
};

function marked(text: string, matched: readonly EmailEvidence[], activeQuote: string | null): ReactNode[] {
  return segmentParagraph(text, matched).map((s, j) =>
    s.supports ? (
      // A quote that supports the urgency is marked red even when it also
      // supports the category: red means it raises the stakes.
      <EvidenceMark key={j} supports={s.supports.includes("urgency") ? "urgency" : "category"} active={s.text === activeQuote}>
        {s.text}
      </EvidenceMark>
    ) : (
      s.text
    ),
  );
}

/**
 * The customer's email, subject and body, with each quote the model used
 * marked in place, in the subject line as in the body. A quote cited for
 * both fields is marked once, and the evidence item under either field
 * highlights that same mark.
 */
export function EmailBody({ subject, body, evidence = [], activeQuote = null, meta, ...props }: EmailBodyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const matched = matchEvidence(body, evidence, subject);

  useEffect(() => {
    if (!activeQuote) return;
    const mark = ref.current?.querySelector("mark[data-active]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    mark?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [activeQuote]);

  return (
    <div ref={ref} {...props} className={styles.email}>
      {subject !== undefined && (
        <h3 className={`text-title ${styles.subject}`}>{subject ? marked(subject, matched, activeQuote) : "(No subject)"}</h3>
      )}
      {meta}
      <div className={`text-reading ${styles.body}`}>
        {paragraphsOf(body).map((paragraph, i) => (
          <p key={i} className={styles.paragraph}>
            {marked(paragraph, matched, activeQuote)}
          </p>
        ))}
      </div>
    </div>
  );
}

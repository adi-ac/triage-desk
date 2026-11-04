"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { matchEvidence, paragraphsOf, segmentParagraph } from "@/lib/evidence";
import type { Evidence } from "@/lib/suggestion";
import { EvidenceMark } from "./evidence-mark";
import styles from "./email-body.module.css";

export type EmailBodyProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** The email as received; paragraphs are split on blank lines, line breaks kept. */
  body: string;
  /** The model's quotes. Any that don't match the email word for word are dropped. */
  evidence?: readonly Evidence[];
  /** The quote whose evidence item is hovered or focused: marked solid and scrolled into view. */
  activeQuote?: string | null;
};

/**
 * The customer's email, with each quote the model used marked in place. A
 * quote cited for both fields is marked once, and the evidence item under
 * either field highlights that same mark.
 */
export function EmailBody({ body, evidence = [], activeQuote = null, ...props }: EmailBodyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const matched = matchEvidence(body, evidence);

  useEffect(() => {
    if (!activeQuote) return;
    const mark = ref.current?.querySelector("mark[data-active]");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    mark?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [activeQuote]);

  return (
    <div ref={ref} {...props} className={`text-reading ${styles.body}`}>
      {paragraphsOf(body).map((paragraph, i) => (
        <p key={i} className={styles.paragraph}>
          {segmentParagraph(paragraph, matched).map((s, j) =>
            s.supports ? (
              // A quote that supports the urgency is marked red even when it
              // also supports the category: red means it raises the stakes.
              <EvidenceMark key={j} supports={s.supports.includes("urgency") ? "urgency" : "category"} active={s.text === activeQuote}>
                {s.text}
              </EvidenceMark>
            ) : (
              s.text
            ),
          )}
        </p>
      ))}
    </div>
  );
}

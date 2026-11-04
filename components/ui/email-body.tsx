import type { ComponentProps } from "react";
import { matchEvidence, paragraphsOf, segmentParagraph } from "@/lib/evidence";
import type { Evidence } from "@/lib/suggestion";
import { EvidenceMark } from "./evidence-mark";
import styles from "./email-body.module.css";

export type EmailBodyProps = Omit<ComponentProps<"div">, "className" | "style" | "children"> & {
  /** The email as received; paragraphs are split on blank lines, line breaks kept. */
  body: string;
  /** The model's quotes. Any that don't match the email word for word are dropped. */
  evidence?: readonly Evidence[];
};

/** The customer's email, with each quote the model used marked in place. */
export function EmailBody({ body, evidence = [], ...props }: EmailBodyProps) {
  const matched = matchEvidence(body, evidence);
  return (
    <div {...props} className={`text-reading ${styles.body}`}>
      {paragraphsOf(body).map((paragraph, i) => (
        <p key={i} className={styles.paragraph}>
          {segmentParagraph(paragraph, matched).map((s, j) =>
            s.supports ? (
              <EvidenceMark key={j} supports={s.supports}>
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

import type { ComponentProps } from "react";
import { EvidenceMark } from "./evidence-mark";
import styles from "./evidence-item.module.css";

export type EvidenceSupports = "category" | "urgency";

export type EvidenceItemProps = Omit<ComponentProps<"div">, "className" | "style"> & {
  /** Which suggestion the quote backs. Named in words, so color isn't the only cue. */
  supports: EvidenceSupports;
};

/** A quote in the evidence list, marked the way it's marked in the email. Children are the quote. */
export function EvidenceItem({ supports, children, ...props }: EvidenceItemProps) {
  return (
    <div {...props} className={styles.item}>
      <span className={`text-overline ${styles.label}`}>{supports === "category" ? "Category" : "Urgency"}</span>
      <q className={`text-reading ${styles.quote}`}>
        <EvidenceMark supports={supports}>{children}</EvidenceMark>
      </q>
    </div>
  );
}

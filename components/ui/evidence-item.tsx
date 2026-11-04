import type { ComponentProps } from "react";
import styles from "./evidence-item.module.css";

export type EvidenceSupports = "category" | "urgency";

export type EvidenceItemProps = Omit<ComponentProps<"div">, "className" | "style"> & {
  /** Which suggestion the quote backs. Named in words, so color isn't the only cue. */
  supports: EvidenceSupports;
};

/** A quote the model used, marked the way it's marked in the email. Children are the quote. */
export function EvidenceItem({ supports, children, ...props }: EvidenceItemProps) {
  return (
    <div {...props} className={styles.item} data-supports={supports}>
      <span className={`text-overline ${styles.label}`}>{supports === "category" ? "Category" : "Urgency"}</span>
      <q className={`text-reading ${styles.quote}`}>
        <span className={styles.mark}>{children}</span>
      </q>
    </div>
  );
}

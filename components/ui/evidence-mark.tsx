import type { ComponentProps } from "react";
import type { EvidenceSupports } from "./evidence-item";
import styles from "./evidence-mark.module.css";

export type EvidenceMarkProps = Omit<ComponentProps<"mark">, "className" | "style"> & {
  supports: EvidenceSupports;
};

/**
 * A quote the model used, marked inside the email: a fill plus a dashed
 * underline, since the model made the mark. Category is gray, urgency red.
 * Children are the exact words from the email.
 */
export function EvidenceMark({ supports, ...props }: EvidenceMarkProps) {
  return <mark {...props} className={styles.mark} data-supports={supports} />;
}

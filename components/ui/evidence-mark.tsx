import type { ComponentProps } from "react";
import type { EvidenceSupports } from "@/lib/suggestion";
import styles from "./evidence-mark.module.css";

export type EvidenceMarkProps = Omit<ComponentProps<"mark">, "className" | "style"> & {
  supports: EvidenceSupports;
  /** Its evidence item is hovered or focused: the dashed underline turns solid. */
  active?: boolean;
};

/**
 * A quote the model used, marked inside the email: a fill plus a dashed
 * underline, since the model made the mark. Category is gray, urgency red.
 * Children are the exact words from the email.
 */
export function EvidenceMark({ supports, active = false, ...props }: EvidenceMarkProps) {
  return <mark {...props} className={styles.mark} data-supports={supports} data-active={active || undefined} />;
}

import type { ComponentProps, ReactNode } from "react";
import styles from "./chip.module.css";

export type ChipState = "default" | "suggested" | "decided";

type ChipBase = Omit<ComponentProps<"span">, "className" | "style"> & {
  /** Marks the value the model picked, in words. */
  aiPick?: boolean;
};

/**
 * A field value. suggested is the model's pencil (dashed); decided is a
 * person's ink (solid), and always says how it was decided, since high
 * confidence shares its petrol: who set it, or "Approved as suggested" when
 * the ticket was approved without anyone touching the field. default is an
 * option nobody has picked.
 */
export type ChipProps = ChipBase &
  (
    | { state?: "default" | "suggested"; decidedBy?: never; asSuggested?: never }
    | { state: "decided"; /** Who set it: "you" or a name. */ decidedBy: string; asSuggested?: never }
    | {
        state: "decided";
        /** Approved with the ticket, untouched. Never claims a person chose it. */
        asSuggested: true;
        decidedBy?: never;
      }
  );

export function Chip({ state = "default", aiPick = false, decidedBy, asSuggested, children, ...props }: ChipProps) {
  return (
    <span {...props} className={`text-body-strong ${styles.chip}`} data-state={state}>
      <span>{children}</span>
      {aiPick && <Meta>AI pick</Meta>}
      {state === "decided" && <Meta>{asSuggested ? "Approved as suggested" : `Set by ${decidedBy}`}</Meta>}
    </span>
  );
}

function Meta({ children }: { children: ReactNode }) {
  return (
    <span className={`text-small ${styles.meta}`}>
      <span aria-hidden>·</span> {children}
    </span>
  );
}

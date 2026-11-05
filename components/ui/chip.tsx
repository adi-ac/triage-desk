import type { ComponentProps, ReactNode } from "react";
import styles from "./chip.module.css";

export type ChipState = "default" | "suggested" | "decided";

type ChipBase = Omit<ComponentProps<"span">, "className" | "style"> & {
  /** Marks the value the model picked, in words. */
  aiPick?: boolean;
};

/**
 * A field value. suggested is the model's pencil (soft gray fill); decided
 * is a person's ink (petrol tint, solid petrol border), and always says how
 * it was decided. "Approved as suggested" is shown. Who set it ("set by
 * you", or "kept Claude's pick" when the person kept the model's value) is
 * in the accessible name only: FieldReview's "Claude suggested <pick> · n%"
 * line under the chip says it visibly. default is an option nobody has
 * picked; on it, aiPick shows "AI pick".
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
  const decided = state === "decided";
  const spoken = aiPick
    ? decidedBy === "you"
      ? "kept Claude's pick"
      : `${decidedBy} kept Claude's pick`
    : `set by ${decidedBy}`;
  return (
    <span {...props} className={`text-body-strong ${styles.chip}`} data-state={state}>
      <span>{children}</span>
      {aiPick && !decided && <Meta>AI pick</Meta>}
      {decided && asSuggested && <Meta>Approved as suggested</Meta>}
      {decided && !asSuggested && <span className="visually-hidden">, {spoken}</span>}
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

"use client";

import type { Blocker } from "@/lib/approve";
import { Button } from "./button";
import { Time } from "./time";
import styles from "./approve-bar.module.css";

export type ApproveBarProps = {
  /** From approveBlockers(). Approve is disabled while any is open. */
  blockers: readonly Blocker[];
  /** The id of the full blocker list in the card, which describes the disabled button. */
  blockersId: string;
  /** The element to jump to for each blocker target: { category: "...", draft: "..." }. */
  targets: Readonly<Record<string, string>>;
  onApprove: () => void;
  /** When the reply was sent, ISO 8601; null until then. */
  sentAt: string | null;
  /** next-ticket inside the inbox; back-to-inbox for a ticket opened on its own. */
  afterSend: "next-ticket" | "back-to-inbox";
  onAfterSend: () => void;
};

const labelFor = (target: string) => target[0].toUpperCase() + target.slice(1);

function jump(id: string | undefined) {
  const el = id ? document.getElementById(id) : null;
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

/**
 * The triage pane's footer: Approve, and a one-line summary of what blocks
 * it ("2 things to resolve: Category, Draft") whose items jump to the field.
 * The full list stays in the card. Once sent: "Sent by you · <time>" and the
 * button that moves on.
 */
export function ApproveBar({ blockers, blockersId, targets, onApprove, sentAt, afterSend, onAfterSend }: ApproveBarProps) {
  if (sentAt) {
    return (
      <div className={styles.bar}>
        <p className={`text-small ${styles.sent}`}>
          Sent by you · <Time dateTime={sentAt} />
        </p>
        <Button onClick={onAfterSend}>{afterSend === "next-ticket" ? "Next ticket" : "Back to inbox"}</Button>
      </div>
    );
  }

  const blocked = blockers.length > 0;
  return (
    <div className={styles.bar}>
      <Button variant="primary" disabled={blocked} aria-describedby={blocked ? blockersId : undefined} onClick={onApprove}>
        Approve and send
      </Button>
      {blocked && (
        <p className={`text-small ${styles.summary}`}>
          {blockers.length} {blockers.length === 1 ? "thing" : "things"} to resolve:{" "}
          {blockers.map((b, i) => (
            <span key={b.target}>
              {i > 0 && ", "}
              <button type="button" className={styles.jump} onClick={() => jump(targets[b.target])}>
                {labelFor(b.target)}
              </button>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

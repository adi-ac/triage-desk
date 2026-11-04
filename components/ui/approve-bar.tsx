"use client";

import { useId } from "react";
import type { Blocker } from "@/lib/approve";
import { Button } from "./button";
import { Time } from "./time";
import styles from "./approve-bar.module.css";

export type ApproveBarProps = {
  /** From approveBlockers(). Approve is disabled while any is open. */
  blockers: readonly Blocker[];
  /** The element to jump to for each blocker target: { category: "...", draft: "..." }. */
  targets: Readonly<Record<string, string>>;
  onApprove: () => void;
  /** When the reply was sent, ISO 8601; null until then. */
  sentAt: string | null;
  /** Who sent it: a person (you) or a team rule. */
  sentBy?: "you" | "rule";
  /** closed: the ticket was closed without a reply (a kept "Not a request"); sentAt is when. */
  outcome?: "sent" | "closed";
  /** next-ticket inside the inbox; back-to-inbox for a ticket opened on its own. */
  afterSend: "next-ticket" | "back-to-inbox";
  onAfterSend: () => void;
};

const labelFor = (target: string) => target[0].toUpperCase() + target.slice(1);

function jump(id: string | undefined) {
  // Next keeps recently visited pages mounted but hidden, so an ID can exist
  // more than once; jump to the copy that's actually on screen.
  const el = id ? [...document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)].find((e) => e.getClientRects().length > 0) : null;
  if (!el) return;
  el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el.focus({ preventScroll: true });
}

/**
 * The triage pane's footer: Approve, and a one-line summary of what blocks
 * it ("2 things to resolve: Category, Draft") whose items jump to where each
 * is fixed. Each reason is shown there, not in a list. Once sent:
 * "Sent by you · <time>" (or "Sent by rule") and the button that moves on.
 */
export function ApproveBar({ blockers, targets, onApprove, sentAt, sentBy = "you", outcome = "sent", afterSend, onAfterSend }: ApproveBarProps) {
  const summaryId = useId();

  if (sentAt) {
    return (
      <div className={styles.bar}>
        <p className={`text-small ${styles.sent}`}>
          {outcome === "closed" ? "Closed by you" : `Sent by ${sentBy === "you" ? "you" : "rule"}`} · <Time dateTime={sentAt} />
        </p>
        <Button onClick={onAfterSend}>{afterSend === "next-ticket" ? "Next ticket" : "Back to inbox"}</Button>
      </div>
    );
  }

  const blocked = blockers.length > 0;
  return (
    <div className={styles.bar}>
      <Button variant="primary" disabled={blocked} aria-describedby={blocked ? summaryId : undefined} onClick={onApprove}>
        Approve and send
      </Button>
      {blocked && (
        <p id={summaryId} className={`text-small ${styles.summary}`}>
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

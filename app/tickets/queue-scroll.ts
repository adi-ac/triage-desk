/**
 * Scrolling a ticket's row into view in every queue list on screen (the
 * desktop pane, and the queue panel when it's open), inside the list's own
 * scroller, so the page never moves.
 */

/**
 * nearest: just into view (a ticket just added). center: to the middle of
 * the list (an added ticket's row moving to Probably no action), only if
 * it's the open ticket. smooth falls back to instant under reduced motion.
 */
export function revealQueueRow(id: string, to: "nearest" | "center", smooth: boolean) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const list of document.querySelectorAll<HTMLElement>("[data-queue]")) {
    const scroller = list.parentElement;
    const row = list.querySelector<HTMLElement>(`[data-ticket-id="${CSS.escape(id)}"]`);
    if (!scroller || !row || !scroller.getClientRects().length) continue;
    if (to === "center" && !row.querySelector("[aria-current]")) continue;
    const box = scroller.getBoundingClientRect();
    const r = row.getBoundingClientRect();
    const top =
      to === "center"
        ? scroller.scrollTop + r.top - box.top - (box.height - r.height) / 2
        : r.top < box.top
          ? scroller.scrollTop + r.top - box.top
          : r.bottom > box.bottom
            ? scroller.scrollTop + r.bottom - box.bottom
            : null;
    if (top !== null) scroller.scrollTo({ top, behavior: smooth && !reduced ? "smooth" : "instant" });
  }
}

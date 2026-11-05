/**
 * How a moment is shown, in the viewer's time zone: the time alone if it's
 * today, the date and time if it's older (with the year if it's another
 * year), and the full timestamp with its zone as the title. No React here:
 * the root layout embeds this exact function as an inline script (so dates
 * are local before the first paint), and Time calls it on the client, so
 * both always produce the same text.
 *
 * Self-contained on purpose (no imports, no outside variables): its source
 * is copied into the page with toString().
 */
export function formatTime(iso: string, nowMs: number): [text: string, title: string] {
  const date = new Date(iso);
  const now = new Date(nowMs);
  const sameDay = date.toDateString() === now.toDateString();
  const sameYear = date.getFullYear() === now.getFullYear();
  const options: Intl.DateTimeFormatOptions = sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: sameYear ? undefined : "numeric", hour: "2-digit", minute: "2-digit" };
  return [
    new Intl.DateTimeFormat(undefined, options).format(date),
    new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long" }).format(date),
  ];
}

/**
 * For <head>: defines window.__applyTime(el), which writes formatTime's text
 * and title into a <time datetime="…"> element. Each Time calls it from an
 * inline script right after its element, before the browser paints it.
 */
export const timeScript = `window.__formatTime=${formatTime.toString()};window.__applyTime=function(el){if(!el||!el.getAttribute)return;var r=window.__formatTime(el.getAttribute("datetime"),Date.now());el.textContent=r[0];el.title=r[1];};`;

/** Each Time's own inline script: format the <time> just before it. */
export const applyTimeScript = `window.__applyTime&&window.__applyTime(document.currentScript.previousElementSibling)`;

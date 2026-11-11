"use client";

import { useSyncExternalStore, type ComponentProps } from "react";
import { applyTimeScript, formatTime } from "@/lib/time-format";
import styles from "./time.module.css";

const subscribe = () => () => {};
const todaySnapshot = () => new Date().toDateString();

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * What the server writes into the HTML. Never seen: the inline script after
 * the element replaces it with local time before the first paint. Built by
 * hand so the server render doesn't read the current time (Cache Components
 * prerendering forbids it) or depend on Node's date data.
 */
const placeholder = (date: Date) =>
  `${date.getUTCDate()} ${months[date.getUTCMonth()]}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

export type TimeProps = Omit<ComponentProps<"time">, "className" | "style" | "children" | "dateTime" | "title"> & {
  /** ISO 8601. */
  dateTime: string;
  /**
   * mono (the default): text-mono-small, as in lists, headers and the
   * timeline. inherit: the surrounding text's own font, with tabular
   * figures, for a time inside a sentence of body text (the Email pane's
   * "Received" line).
   */
  font?: "mono" | "inherit";
};

/**
 * A moment, in the viewer's time zone: the time if it's today, the date and
 * time if it's older, and the full timestamp with its zone on hover. Mono
 * by default, so figures line up; or the surrounding text's font, with
 * tabular figures (font="inherit").
 *
 * Never shown in UTC, not even before the page hydrates: on a full page load
 * an inline script right after the <time> writes the local text before the
 * first paint (lib/time-format.ts, Next's documented pattern), and
 * suppressHydrationWarning keeps it; after hydration the client renders the
 * same text, so nothing changes on screen. On client-side navigation the
 * script is inert (text/plain) and the component formats directly.
 */
export function Time({ dateTime, font = "mono", ...props }: TimeProps) {
  // Today's date on the client (a stable string, so it's a valid snapshot);
  // null on the server and during hydration, where the placeholder renders.
  const today = useSyncExternalStore(subscribe, todaySnapshot, () => null);
  const [text, title] =
    today === null ? [placeholder(new Date(dateTime)), undefined] : formatTime(dateTime, new Date(today).getTime());
  return (
    <>
      <time
        {...props}
        dateTime={dateTime}
        title={title}
        className={font === "inherit" ? styles.inherit : "text-mono-small"}
        suppressHydrationWarning
      >
        {text}
      </time>
      <script
        // Runs during HTML parsing on a full load; on the client React
        // renders it as text/plain, so it never runs twice and React doesn't
        // warn about rendering a script.
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: applyTimeScript }}
      />
    </>
  );
}

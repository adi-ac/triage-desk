"use client";

import { useSyncExternalStore, type ComponentProps } from "react";

const subscribe = () => () => {};

/** Short form in the viewer's time zone: the time today, the date and time before that. */
function short(date: Date, now: Date) {
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(date);
  const sameYear = date.getFullYear() === now.getFullYear();
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: sameYear ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const full = (date: Date) => new Intl.DateTimeFormat(undefined, { dateStyle: "full", timeStyle: "long" }).format(date);

/** The server doesn't know the viewer's zone, so it renders UTC until the page hydrates. */
const serverShort = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(date);

export type TimeProps = Omit<ComponentProps<"time">, "className" | "style" | "children" | "dateTime" | "title"> & {
  /** ISO 8601. */
  dateTime: string;
};

/**
 * A moment, in the viewer's time zone: the time if it's today, the date and
 * time if it's older, and the full timestamp with its zone on hover. Mono,
 * so figures line up.
 */
export function Time({ dateTime, ...props }: TimeProps) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const date = new Date(dateTime);
  return (
    <time {...props} dateTime={dateTime} title={hydrated ? full(date) : undefined} className="text-mono-small">
      {hydrated ? short(date, new Date()) : serverShort(date)}
    </time>
  );
}

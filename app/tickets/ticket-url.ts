"use client";

import { usePathname } from "next/navigation";

/**
 * Opening tickets in the inbox without a server round trip (DESIGN.md,
 * Layout). Everything a ticket shows is already on the client (the
 * fixtures, the recordings, tickets added in this tab), so switching
 * tickets is only a URL change: history.pushState, which the App Router
 * syncs with usePathname (node_modules/next/dist/docs, Linking and
 * navigating, Native History API). Back and Forward restore those entries
 * the same way, without a request. The route and generateStaticParams stay,
 * so a reload or a pasted /tickets/<id> still loads directly.
 *
 * The ID is read from the pathname, never with useParams: pushState keeps
 * the route tree that was loaded (it doesn't fetch the new segment), so
 * useParams would keep the first ticket's ID.
 */

export const ticketPath = (id: string) => `/tickets/${encodeURIComponent(id)}`;

/** The ticket ID in a /tickets/<id> pathname, or "" for any other path. */
export function ticketIdFrom(pathname: string) {
  const match = /^\/tickets\/([^/]+)\/?$/.exec(pathname);
  return match ? decodeURIComponent(match[1]) : "";
}

/** The open ticket's ID, following pushState, Back and Forward. */
export function useTicketId() {
  return ticketIdFrom(usePathname());
}

/** Opens a ticket: a new history entry, no request. Nothing if it's already open. */
export function showTicket(id: string) {
  const path = ticketPath(id);
  if (location.pathname !== path) history.pushState(null, "", path);
}

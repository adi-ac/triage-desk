import type { Metadata } from "next";
import { tickets } from "@/fixtures/tickets";
import { TicketPanes } from "./ticket-panes";

export function generateStaticParams() {
  return tickets.map((t) => ({ id: t.id }));
}

export const metadata: Metadata = { title: "Inbox · Triage Desk" };

/**
 * The open ticket's panes. The ticket ID is read on the client (useParams),
 * not from params here: reading params on the server would block instant
 * navigation between tickets under Cache Components.
 */
export default function TicketPage() {
  return <TicketPanes />;
}

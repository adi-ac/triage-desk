import { tickets } from "@/fixtures/tickets";
import { TicketPanes } from "./ticket-panes";

export function generateStaticParams() {
  return tickets.map((t) => ({ id: t.id }));
}

/**
 * The open ticket's panes. The ticket ID is read on the client, from the
 * pathname (ticket-url.ts), not from params here: opening another ticket is
 * a pushState with no request, and reading params on the server would
 * block navigation under Cache Components anyway. This route still serves
 * a reload or a pasted /tickets/<id>.
 */
export default function TicketPage() {
  return <TicketPanes />;
}

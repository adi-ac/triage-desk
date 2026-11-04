import { redirect } from "next/navigation";
import { firstScreenTicketId } from "@/fixtures/tickets";

/** The link opens straight onto the unsure ticket (docs/brief.md, First screen). */
export default function Home() {
  redirect(`/tickets/${firstScreenTicketId}`);
}

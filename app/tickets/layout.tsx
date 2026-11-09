import { Suspense } from "react";
import { InboxShell, InboxShellFallback } from "./inbox-shell";

/**
 * The inbox reads the ticket ID with useParams() on the client (DESIGN.md,
 * Layout). With Cache Components that's request-time data for an ID that
 * isn't in generateStaticParams (a ticket added in the browser), so the
 * shell sits in a Suspense boundary: the build prerenders the 40 fixture
 * tickets in full, and the generic App Shell for any other ID shows the
 * inbox's empty frame until the ID is known. A client navigation already
 * has the ID, so it never shows the fallback.
 */
export default function InboxLayout({ children }: LayoutProps<"/tickets">) {
  return (
    <Suspense fallback={<InboxShellFallback />}>
      <InboxShell>{children}</InboxShell>
    </Suspense>
  );
}

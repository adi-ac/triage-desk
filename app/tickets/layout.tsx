import { InboxShell } from "./inbox-shell";

export default function InboxLayout({ children }: LayoutProps<"/tickets">) {
  return <InboxShell>{children}</InboxShell>;
}

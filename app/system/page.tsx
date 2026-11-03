import type { Metadata } from "next";
import { SystemPage } from "./system-page";

export const metadata: Metadata = {
  title: "Design system · Triage Desk",
};

export default function Page() {
  return <SystemPage />;
}

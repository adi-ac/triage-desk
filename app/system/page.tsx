import type { Metadata } from "next";
import { SystemPage } from "./system-page";

export const metadata: Metadata = {
  title: "Design system · TriageDesk",
};

export default function Page() {
  return <SystemPage />;
}

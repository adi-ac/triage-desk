import type { Metadata } from "next";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Triage Desk",
  description: "AI support-ticket triage with human-in-the-loop review",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

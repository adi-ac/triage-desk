import type { Metadata } from "next";
import { themeScript } from "@/lib/theme";
import { timeScript } from "@/lib/time-format";
import { pressScript } from "@/lib/press";
import { viewportScript } from "@/lib/viewport";
import { Geist, Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "@/styles/elevation.css";
import "@/styles/type.css";
import "@/styles/trust.css";
import "@/styles/motion.css";
import "./globals.css";

const heading = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const body = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// No title here: each route sets its own. The inbox's comes from the open
// ticket, on the client (app/tickets/[id]/ticket-panes.tsx).
export const metadata: Metadata = {
  description: "AI support-ticket triage with human-in-the-loop review",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the script below may set data-theme on <html>
    // before React hydrates (ThemeToggle, lib/theme.ts).
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Lets each Time write local time before the first paint (lib/time-format.ts). */}
        <script dangerouslySetInnerHTML={{ __html: timeScript }} />
        {/* iOS and iPadOS only: no zoom when a 14px field is tapped (lib/viewport.ts). */}
        <script dangerouslySetInnerHTML={{ __html: viewportScript }} />
        {/* iOS and iPadOS: lets Button's press state (:active) show on touch (lib/press.ts). */}
        <script dangerouslySetInnerHTML={{ __html: pressScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

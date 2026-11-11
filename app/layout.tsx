import type { Metadata } from "next";
import { themeScript } from "@/lib/theme";
import { timeScript } from "@/lib/time-format";
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

const description = "AI support-ticket triage with human-in-the-loop review";

// No title here: each route sets its own. The inbox's comes from the open
// ticket, on the client (app/tickets/[id]/ticket-panes.tsx). The icons and
// the share image are Next's metadata files in app/ (favicon.ico, icon.svg,
// apple-icon.png, opengraph-image.jpg with its .alt.txt), so every page
// gets them; metadataBase makes the image's URL absolute. X reads the same
// image through og:image, as a large card.
export const metadata: Metadata = {
  metadataBase: new URL("https://adi-triagedesk.vercel.app"),
  description,
  openGraph: {
    title: "TriageDesk",
    description,
    siteName: "TriageDesk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
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
      </head>
      <body>{children}</body>
    </html>
  );
}

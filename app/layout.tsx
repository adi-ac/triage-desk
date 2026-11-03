import type { Metadata } from "next";
import { Geist, Geist_Mono, Schibsted_Grotesk } from "next/font/google";
import "@/styles/tokens.css";
import "@/styles/theme.css";
import "@/styles/elevation.css";
import "@/styles/type.css";
import "@/styles/trust.css";
import "./globals.css";

const heading = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted" });
const body = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Triage Desk",
  description: "AI support-ticket triage with human-in-the-loop review",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${heading.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

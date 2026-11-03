"use client";

import { useEffect, useRef, useState } from "react";
import { firstScreenTicketId, tickets } from "@/fixtures/tickets";
import styles from "./system.module.css";

const ticket = tickets.find((t) => t.id === firstScreenTicketId)!;
const firstParagraph = ticket.body.split("\n\n")[1];

type Role = {
  name: string;
  className: string;
  family: "heading" | "body" | "mono";
  spec: string;
  use: string;
  sample: string;
};

const roles: Role[] = [
  {
    name: "title",
    className: "text-title",
    family: "heading",
    spec: "20 / 1.25 · 600 · −0.012em",
    use: "Ticket subject, page title",
    sample: ticket.subject,
  },
  {
    name: "heading",
    className: "text-heading",
    family: "heading",
    spec: "16 / 1.3 · 600 · −0.006em",
    use: "Pane titles",
    sample: "Triage",
  },
  {
    name: "subheading",
    className: "text-subheading",
    family: "heading",
    spec: "14 / 1.4 · 600",
    use: "Section heads inside a pane",
    sample: "Why Approve is blocked",
  },
  {
    name: "body",
    className: "text-body",
    family: "body",
    spec: "14 / 1.5 · 400",
    use: "Default UI text",
    sample: "The model can't separate How-to from Cancellation risk. Pick one to continue.",
  },
  {
    name: "body-strong",
    className: "text-body-strong",
    family: "body",
    spec: "14 / 1.5 · 500",
    use: "Buttons, selected rows, emphasis",
    sample: "Approve and send",
  },
  {
    name: "reading",
    className: "text-reading",
    family: "body",
    spec: "14 / 1.6 · 400 · max 32em (~71 characters)",
    use: "The customer's email",
    sample: firstParagraph,
  },
  {
    name: "small",
    className: "text-small",
    family: "body",
    spec: "13 / 1.45 · 400",
    use: "Metadata, help text, captions",
    sample: `${ticket.from.name} · ${ticket.account?.company} · ${ticket.account?.plan}`,
  },
  {
    name: "overline",
    className: "text-overline",
    family: "body",
    spec: "12 / 1.4 · 500 · +0.05em · uppercase",
    use: "Labels above a group",
    sample: "Suggested category",
  },
  {
    name: "mono",
    className: "text-mono",
    family: "mono",
    spec: "13 / 1.45 · 400 · tabular, slashed zero",
    use: "IDs, timestamps, figures",
    sample: `${ticket.id} · 2026-11-02 16:48 UTC · 0.61`,
  },
  {
    name: "mono-small",
    className: "text-mono-small",
    family: "mono",
    spec: "12 / 1.4 · 400 · tabular, slashed zero",
    use: "Timeline times, counts in badges",
    sample: "16:48 · 16:52 · 17:03 · 40",
  },
];

const familyVar = {
  heading: "--font-schibsted",
  body: "--font-geist",
  mono: "--font-geist-mono",
} as const;

export function TypeSection() {
  return (
    <>
      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Scale</h3>
        <ul className={styles.scale}>
          {roles.map((r) => (
            <li key={r.name} className={styles.row}>
              <div className={styles.meta}>
                <span className="text-mono">{r.name}</span>
                <span className={`text-mono-small ${styles.muted} ${styles.spec}`}>{r.spec}</span>
                <span className={`text-small ${styles.muted}`}>{r.use}</span>
              </div>
              <p className={`${r.className} ${styles.sample}`}>{r.sample}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>In context</h3>
        <TicketHeader />
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Figures</h3>
        <Figures />
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Loading without layout shift</h3>
        <FallbackCheck />
      </section>
    </>
  );
}

function TicketHeader() {
  return (
    <div className={styles.ticket}>
      <div className={styles.ticketTop}>
        <span className={`text-mono ${styles.muted}`}>{ticket.id}</span>
        <span className={`text-mono-small ${styles.muted}`}>2 Nov 2026 · 16:48 UTC</span>
      </div>
      <h4 className="text-title">{ticket.subject}</h4>
      <p className={`text-small ${styles.muted}`}>
        {ticket.from.name} · {ticket.account?.company} · {ticket.account?.plan}
      </p>
      <div className={styles.suggestion}>
        <p className={`text-overline ${styles.muted}`}>Suggested category</p>
        <div className={styles.candidates}>
          <span className="text-body-strong">How-to</span>
          <span className={`text-mono ${styles.muted}`}>0.48</span>
          <span className="text-body">Cancellation risk</span>
          <span className={`text-mono ${styles.muted}`}>0.41</span>
        </div>
        <p className="text-body">
          Approve is blocked: the top two categories are 0.07 apart, below the 0.15 margin.
        </p>
      </div>
      <div className="text-reading">
        {ticket.body.split("\n\n").map((p, i) => (
          <p key={i} className={styles.paragraph}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function Figures() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, []);

  // A made-up wait time that runs fast so every digit gets a turn.
  const seconds = 3600 + tick * 7;
  const wait = `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`;
  const count = 1 + ((tick * 13) % 1999);

  const confidences = [0.48, 0.41, 0.07, 0.11, 0.04];

  return (
    <div className={styles.figures}>
      <div className={styles.figureCol}>
        <p className={`text-overline ${styles.muted}`}>Geist, proportional</p>
        <p className={`text-body ${styles.proportional}`}>
          Waiting <span className={styles.box}>{wait}</span>
        </p>
        <p className={`text-body ${styles.proportional}`}>
          <span className={styles.box}>{count}</span> open tickets
        </p>
      </div>
      <div className={styles.figureCol}>
        <p className={`text-overline ${styles.muted}`}>Geist, tabular (the default)</p>
        <p className="text-body">
          Waiting <span className={styles.box}>{wait}</span>
        </p>
        <p className="text-body">
          <span className={styles.box}>{count}</span> open tickets
        </p>
      </div>
      <div className={styles.figureCol}>
        <p className={`text-overline ${styles.muted}`}>Geist Mono, a column</p>
        <ul className={styles.column}>
          {confidences.map((c) => (
            <li key={c} className="text-mono">
              {c.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
      <p className={`text-small ${styles.muted} ${styles.figureNote}`}>
        The outlined boxes show the jitter: proportional digits change width as they tick, so the
        box and the words after it move. Mono IDs use a slashed zero: LL-5040, 0O.
      </p>
    </div>
  );
}

type Measurement = {
  name: string;
  webfont: { w: number; h: number };
  fallback: { w: number; h: number };
};

function FallbackCheck() {
  const [rows, setRows] = useState<Measurement[] | null>(null);
  const [cls, setCls] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const probe = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let total = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!entry.hadRecentInput) total += entry.value;
      }
      setCls(total);
    });
    observer.observe({ type: "layout-shift", buffered: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    document.fonts.ready.then(() => {
      const host = probe.current;
      if (cancelled || !host) return;
      const root = getComputedStyle(document.documentElement);
      const measure = (role: Role, onlyFallback: boolean) => {
        const el = document.createElement("p");
        el.className = role.className;
        el.textContent = role.sample;
        el.style.margin = "0";
        el.style.width = role.className === "text-reading" ? "" : "fit-content";
        el.style.maxInlineSize = role.className === "text-reading" ? "" : "none";
        if (onlyFallback) {
          // The second family in each next/font variable is its metric-matched fallback.
          const fallback = root.getPropertyValue(familyVar[role.family]).split(",")[1];
          el.style.fontFamily = fallback;
        }
        host.append(el);
        const rect = el.getBoundingClientRect();
        el.remove();
        return { w: rect.width, h: rect.height };
      };
      setRows(
        roles.map((r) => ({ name: r.name, webfont: measure(r, false), fallback: measure(r, true) })),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.fallback}>
      <p className={`text-body ${styles.muted}`}>
        next/font self-hosts all three fonts, preloads their Latin files and swaps them in over a
        fallback (local Arial) whose size, ascent and descent are adjusted to match. Below, each
        role is measured twice: in the web font, and in that fallback alone.
      </p>
      <div className={styles.tableWrap}>
        <table className={`text-small ${styles.table}`}>
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">Height, web font</th>
              <th scope="col">Height, fallback</th>
              <th scope="col">Width, web font</th>
              <th scope="col">Width, fallback</th>
            </tr>
          </thead>
          <tbody>
            {/* Placeholder rows until measured, so filling the table doesn't itself shift the page. */}
            {!rows &&
              roles.map((r) => (
                <tr key={r.name}>
                  <th scope="row" className="text-mono">
                    {r.name}
                  </th>
                  {[0, 1, 2, 3].map((i) => (
                    <td key={i} className="text-mono">
                      …
                    </td>
                  ))}
                </tr>
              ))}
            {rows?.map((r) => {
              const dw = ((r.fallback.w - r.webfont.w) / r.webfont.w) * 100;
              return (
                <tr key={r.name}>
                  <th scope="row" className="text-mono">
                    {r.name}
                  </th>
                  <td className="text-mono">{r.webfont.h.toFixed(1)}</td>
                  <td className="text-mono">
                    {r.fallback.h.toFixed(1)}
                    {r.fallback.h !== r.webfont.h && (
                      <span className={styles.diff}> ({(r.fallback.h - r.webfont.h).toFixed(1)})</span>
                    )}
                  </td>
                  <td className="text-mono">{r.webfont.w.toFixed(1)}</td>
                  <td className="text-mono">
                    {r.fallback.w.toFixed(1)}{" "}
                    <span className={styles.muted}>
                      ({dw >= 0 ? "+" : "−"}
                      {Math.abs(dw).toFixed(1)}%)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-body">
        Layout shift on this page since load:{" "}
        <span className="text-mono">{cls.toFixed(4)}</span>
      </p>
      <label className={`text-body ${styles.toggle}`}>
        <input
          type="checkbox"
          checked={showFallback}
          onChange={(e) => setShowFallback(e.target.checked)}
        />
        Overlay the fallback on the ticket header
      </label>
      <div className={styles.overlay} data-show={showFallback}>
        <TicketHeader />
        <div className={styles.overlayFallback} aria-hidden>
          <TicketHeader />
        </div>
      </div>
      <div ref={probe} className={styles.probe} aria-hidden />
    </div>
  );
}

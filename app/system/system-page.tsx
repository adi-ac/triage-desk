"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { ColorSection } from "./color-section";
import { SurfacesSection } from "./surfaces-section";
import { TrustSection } from "./trust-section";
import { TypeSection } from "./type-section";
import styles from "./system.module.css";

type Theme = "system" | "light" | "dark";

const darkQuery = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const mq = matchMedia(darkQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

const sections = [
  { id: "type", title: "Type", files: "styles/type.css" },
  { id: "color", title: "Color", files: "styles/tokens.css, styles/theme.css" },
  { id: "surfaces", title: "Surfaces", files: "styles/elevation.css" },
  { id: "trust", title: "Trust signals", files: "styles/trust.css" },
] as const;

export function SystemPage() {
  const [theme, setTheme] = useState<Theme>("system");
  const prefersDark = useSyncExternalStore(
    subscribe,
    () => matchMedia(darkQuery).matches,
    () => false,
  );
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={`text-overline ${styles.muted}`}>Triage Desk</p>
          <h1 className="text-title">Design system</h1>
          <p className={`text-small ${styles.muted}`}>
            Every token in use, in both themes. Decisions and their reasons are in{" "}
            <code className="text-mono">docs/brief.md</code>.
          </p>
        </div>
        <div className={styles.segmented} role="radiogroup" aria-label="Theme">
          {(["system", "light", "dark"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              className={`text-body-strong ${styles.segment}`}
              onClick={() => setTheme(t)}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <nav className={styles.nav} aria-label="Sections">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-body-strong">
            {s.title}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-title`}>
          <div className={styles.sectionHead}>
            <h2 id={`${s.id}-title`} className="text-title">
              {s.title}
            </h2>
            <code className={`text-mono-small ${styles.muted} ${styles.spec}`}>{s.files}</code>
          </div>
          {s.id === "type" && <TypeSection />}
          {s.id === "color" && <ColorSection theme={resolved} />}
          {s.id === "surfaces" && <SurfacesSection theme={resolved} />}
          {s.id === "trust" && <TrustSection theme={resolved} />}
        </section>
      ))}
    </main>
  );
}

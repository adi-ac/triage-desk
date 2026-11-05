"use client";

import { AppHeader, useTheme } from "@/components/ui";
import { ColorSection } from "./color-section";
import { ComponentsSection } from "./components-section";
import { SurfacesSection } from "./surfaces-section";
import { TrustSection } from "./trust-section";
import { TypeSection } from "./type-section";
import styles from "./system.module.css";

const sections = [
  { id: "type", title: "Type", files: "styles/type.css" },
  { id: "color", title: "Color", files: "styles/tokens.css, styles/theme.css" },
  { id: "surfaces", title: "Surfaces", files: "styles/elevation.css" },
  { id: "trust", title: "Trust signals", files: "styles/trust.css" },
  { id: "components", title: "Components", files: "components/ui" },
] as const;

export function SystemPage() {
  // The page theme: the header's toggle, the same one the inbox has. System
  // (the default) follows the OS live; a Light or Dark pick is remembered and
  // shared with the inbox.
  const resolved = useTheme();

  return (
    <main className={styles.page}>
      <AppHeader />
      <div className={styles.header}>
        <h1 className="text-title">Design system</h1>
        <p className={`text-small ${styles.muted}`}>
          Every token in use, in both themes. The theme toggle in the header sets the page theme;
          each demo below also shows both side by side. Decisions and their reasons are in{" "}
          <code className="text-mono">docs/brief.md</code>.
        </p>
      </div>

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
          {s.id === "components" && <ComponentsSection theme={resolved} />}
        </section>
      ))}
    </main>
  );
}

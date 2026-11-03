"use client";

import { useEffect, useState } from "react";
import { Swatch } from "./contrast-table";
import styles from "./system.module.css";

const colorSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const ramps: { name: string; note: string; steps: string[] }[] = [
  {
    name: "grey",
    note: "Neutral, no tint",
    steps: ["0", "25", "50", "100", "200", "275", "300", "400", "500", "600", "700", "800", "900", "950", "975", "990"],
  },
  { name: "petrol", note: "Accent, hue 215", steps: colorSteps },
  { name: "amber", note: "Warning, hue 65", steps: colorSteps },
  { name: "red", note: "Critical, hue 27", steps: colorSteps },
  { name: "green", note: "Success, hue 150", steps: colorSteps },
];

const roleGroups: { name: string; roles: string[] }[] = [
  {
    name: "Surfaces",
    roles: ["--page", "--bg", "--tray", "--surface", "--surface-raised", "--surface-2", "--line", "--line-strong"],
  },
  { name: "Text", roles: ["--ink", "--ink-2", "--ink-3"] },
  {
    name: "Accent",
    roles: ["--accent", "--accent-hover", "--accent-ink", "--accent-soft", "--accent-text", "--focus-ring"],
  },
  {
    name: "Status",
    roles: ["--warning", "--warning-soft", "--critical", "--critical-soft", "--success", "--success-soft"],
  },
];

export function ColorSection({ theme }: { theme: string }) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    // Name the primitive each role resolves to in this theme, by matching
    // computed values; anything else (a mix) is shown as "mix".
    const id = requestAnimationFrame(() => {
      const host = document.createElement("span");
      document.body.append(host);
      const resolve = (token: string) => {
        host.style.color = `var(${token})`;
        return getComputedStyle(host).color;
      };
      const byValue = new Map<string, string>();
      for (const ramp of ramps)
        for (const step of ramp.steps) byValue.set(resolve(`--${ramp.name}-${step}`), `${ramp.name}-${step}`);
      const next: Record<string, string> = {};
      for (const g of roleGroups) for (const r of g.roles) next[r] = byValue.get(resolve(r)) ?? "mix";
      host.remove();
      setValues(next);
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  return (
    <>
      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Primitives</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          From <code className="text-mono">styles/tokens.css</code>. One lightness table for every
          ramp, so the same step is equally bright across hues. Components never use these directly.
        </p>
        <div className={styles.ramps}>
          {ramps.map((ramp) => (
            <div key={ramp.name} className={styles.ramp}>
              <div className={styles.rampName}>
                <span className="text-mono">{ramp.name}</span>
                <span className={`text-small ${styles.muted}`}>{ramp.note}</span>
              </div>
              <div className={styles.steps}>
                {ramp.steps.map((step) => (
                  <div key={step} className={styles.step}>
                    <span className={styles.chipSwatch} style={{ background: `var(--${ramp.name}-${step})` }} />
                    <span className={`text-mono-small ${styles.muted}`}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Roles</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          From <code className="text-mono">styles/theme.css</code>. These switch with the theme;
          each shows the primitive it uses in the {theme} theme. The checked pairs are listed at the top of
          theme.css.
        </p>
        <div className={styles.roleGroups}>
          {roleGroups.map((g) => (
            <div key={g.name}>
              <p className={`text-overline ${styles.muted}`}>{g.name}</p>
              <ul className={styles.roles}>
                {g.roles.map((r) => (
                  <li key={r}>
                    <Swatch token={r} />
                    <span className="text-mono">{r}</span>
                    <span className={`text-mono-small ${styles.muted}`}>{values[r] ?? ""}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

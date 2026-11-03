"use client";

import { useEffect, useState } from "react";
import { check, type Pair, type Result } from "./contrast";
import styles from "./system.module.css";

/** Re-measures whenever `theme` changes, after the new theme has painted. */
export function ContrastTable({ pairs, theme }: { pairs: Pair[]; theme: string }) {
  const [measured, setMeasured] = useState<{ theme: string; results: Result[] } | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMeasured({ theme, results: check(pairs) }));
    return () => cancelAnimationFrame(id);
  }, [pairs, theme]);

  // Results from the previous theme would sit under the new theme's label, so wait.
  const results = measured?.theme === theme ? measured.results : null;

  const failures = results?.filter((r) => !r.pass).length ?? 0;

  return (
    <div className={styles.contrast}>
      <p className="text-body">
        {results === null
          ? "Measuring…"
          : failures === 0
            ? `All ${results.length} pairs pass in the ${theme} theme.`
            : `${failures} of ${results.length} pairs fail in the ${theme} theme.`}{" "}
        <span className={styles.muted}>
          Text needs 4.5:1 and APCA Lc 60; borders, rings and meters need 3:1.
        </span>
      </p>
      <div className={styles.tableWrap}>
        <table className={`text-small ${styles.table}`}>
          <thead>
            <tr>
              <th scope="col">Pair</th>
              <th scope="col">Foreground</th>
              <th scope="col">Background</th>
              <th scope="col">WCAG</th>
              <th scope="col">APCA</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((p, i) => {
              const r = results?.[i];
              return (
                <tr key={p.label}>
                  <th scope="row">{p.label}</th>
                  <td className="text-mono-small">
                    <Swatch token={p.fg} />
                    {p.fg}
                  </td>
                  <td className="text-mono-small">
                    <Swatch token={p.bg} />
                    {p.bg}
                  </td>
                  <td className="text-mono">{r ? `${r.wcag.toFixed(2)}:1` : "…"}</td>
                  <td className="text-mono">{r ? Math.abs(r.apca).toFixed(1) : "…"}</td>
                  <td className={r && !r.pass ? styles.fail : styles.pass}>
                    {r ? (r.pass ? "Pass" : "Fail") : "…"}
                    {p.kind === "non-text" && <span className={styles.muted}> · non-text</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Swatch({ token }: { token: string }) {
  return <span className={styles.swatchDot} style={{ background: `var(${token})` }} aria-hidden />;
}

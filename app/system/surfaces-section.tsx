import styles from "./system.module.css";

export function SurfacesSection() {
  return (
    <>
      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Tray and card</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          A grey tray holds the pane&apos;s header and wraps a white card. The card&apos;s radius is
          the tray&apos;s minus the gap (14 − 4 = 10), so the corners stay concentric.
        </p>
        <div className={styles.pageDemo}>
          <div className={styles.tray}>
            <div className={styles.trayHeader}>
              <span className="text-heading">Triage</span>
              <span className={`text-mono-small ${styles.muted}`}>LL-5040</span>
            </div>
            <div className={styles.trayCard}>
              <p className="text-body">The card holds the pane&apos;s content.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Three levels</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          From <code className="text-mono">styles/elevation.css</code>. Light mode uses soft
          shadows; dark mode has none and steps each level lighter with a white hairline ring.
        </p>
        <div className={styles.levels}>
          <div className={styles.level} data-level="pane">
            <span className="text-mono">--shadow-pane</span>
            <span className={`text-small ${styles.muted}`}>Cards, raised buttons</span>
          </div>
          <div className={styles.level} data-level="popover">
            <span className="text-mono">--shadow-popover</span>
            <span className={`text-small ${styles.muted}`}>Popovers, menus</span>
            <div className={styles.menu} role="presentation">
              <span className="text-body">How-to</span>
              <span className={`text-body ${styles.menuActive}`}>Cancellation risk</span>
              <span className="text-body">Billing</span>
            </div>
          </div>
          <div className={styles.level} data-level="dialog">
            <span className="text-mono">--shadow-dialog</span>
            <span className={`text-small ${styles.muted}`}>Dialogs</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <h3 className={`text-heading ${styles.cardTitle}`}>Buttons</h3>
        <p className={`text-body ${styles.muted} ${styles.cardIntro}`}>
          Buttons are raised, because they can be pressed. A disabled button goes flat and sinks to
          bg, so a blocked Approve doesn&apos;t look pressable.
        </p>
        <div className={styles.buttons}>
          <button type="button" className={`text-body-strong ${styles.button}`}>
            Choose a category
          </button>
          <button type="button" className={`text-body-strong ${styles.button} ${styles.primary}`}>
            Approve and send
          </button>
          <button type="button" disabled className={`text-body-strong ${styles.button} ${styles.primary}`}>
            Approve and send
          </button>
        </div>
      </section>
    </>
  );
}

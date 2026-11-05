import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import styles from "./app-header.module.css";

/**
 * The header row on every screen: the logo and "TriageDesk" on the left, the
 * theme toggle on the right. Nothing else goes here, and never a Banner.
 */
export function AppHeader() {
  return (
    <header className={styles.header}>
      <p className={`text-heading ${styles.brand}`}>
        <Logo />
        TriageDesk
      </p>
      <div className={styles.actions}>
        <ThemeToggle />
      </div>
    </header>
  );
}

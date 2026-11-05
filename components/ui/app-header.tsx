import type { ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import styles from "./app-header.module.css";

export type AppHeaderProps = {
  /** IconButtons that follow the theme toggle, such as the inbox's "Open queue". */
  actions?: ReactNode;
};

/**
 * The header row on every screen: the logo and "TriageDesk" on the left; the
 * theme toggle, then any actions, on the right. Nothing else goes here, and
 * never a Banner.
 */
export function AppHeader({ actions }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={`text-heading ${styles.brand}`}>
        <Logo />
        TriageDesk
      </p>
      <div className={styles.actions}>
        <ThemeToggle />
        {actions}
      </div>
    </header>
  );
}

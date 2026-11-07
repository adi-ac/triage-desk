import type { ReactNode } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import styles from "./app-header.module.css";

export type AppHeaderProps = {
  /** After the theme toggle. Only the inbox's queue button on tablets (FabPanelHeaderButton, in a 32px slot). */
  actions?: ReactNode;
};

/**
 * The header row on every screen: the logo and "TriageDesk" on the left, the
 * theme toggle on the right, then any actions. Nothing else goes here, and
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

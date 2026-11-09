import { Icon } from "./icon";
import styles from "./working-status.module.css";

export type WorkingStatusProps = {
  /** What's happening, ending in an ellipsis: "Triaging…". */
  label: string;
  /** While true it shows and moves; set false when the work is done and it fades out. */
  active: boolean;
};

/**
 * Work in progress beside a Pane title (Pane `status`): the AI triaging an
 * added ticket. text-small in --ink-3, a shimmer running through the text
 * and a sparkle turning slowly; when `active` goes false it fades out over
 * 200ms and stays hidden. Mounted inactive, it's hidden from the start.
 * Under reduced motion it holds still and goes at once. Decorative
 * (aria-hidden): the loading content says the same to screen readers.
 */
export function WorkingStatus({ label, active }: WorkingStatusProps) {
  return (
    <span className={`text-small ${styles.status}`} data-active={active ? "" : undefined} aria-hidden>
      <span className={styles.icon}>
        <Icon name="sparkle" size={14} />
      </span>
      <span className={styles.label}>{label}</span>
    </span>
  );
}

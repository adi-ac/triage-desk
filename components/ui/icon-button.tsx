import type { ComponentProps } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./button.module.css";

export type IconButtonProps = Omit<ComponentProps<"button">, "className" | "style" | "children"> & {
  icon: IconName;
  /** The button's name. Required: the icon has no words. */
  "aria-label": string;
  /** default: 32px, 18px icon (header actions, a Sheet's close). small: 28px, 14px icon (inline, beside a value). */
  size?: "default" | "small";
  /**
   * Show the aria-label as a tooltip to the button's right on hover and
   * keyboard focus. Only where there's room to its right: not at a viewport edge.
   */
  tooltip?: boolean;
};

/**
 * A round secondary button holding one icon, with the same chrome as Button
 * (raised, neutral, fully rounded). For header actions such as "Open queue",
 * a Sheet's close, and FieldReview's "Change"; anything that approves stays
 * a labelled Button.
 */
export function IconButton({ icon, size = "default", tooltip = false, type = "button", ...props }: IconButtonProps) {
  return (
    <button type={type} {...props} className={styles.button} data-variant="secondary" data-shape="icon" data-size={size}>
      <Icon name={icon} size={size === "small" ? 14 : 18} />
      {tooltip && (
        // The same words as the aria-label, so it's hidden from screen readers to avoid reading them twice.
        <span className={`text-small ${styles.tooltip}`} aria-hidden>
          {props["aria-label"]}
        </span>
      )}
    </button>
  );
}

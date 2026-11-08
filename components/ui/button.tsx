import type { ComponentProps } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "default" | "small";

export type ButtonProps = Omit<ComponentProps<"button">, "className" | "style"> & {
  /** primary is for the one action a screen is about (Approve). Defaults to secondary. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * An icon before the label, for a small button (a Pane header's action,
   * such as the queue's New ticket): 16px, and the button is 28px tall.
   */
  icon?: IconName;
};

export function Button({
  variant = "secondary",
  size = "default",
  icon,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`${size === "small" ? "text-small" : "text-body"} ${styles.button}`}
      data-variant={variant}
      data-size={size}
      data-icon={icon ? "" : undefined}
    >
      {icon && <Icon name={icon} size={size === "small" ? 16 : 18} />}
      {children}
    </button>
  );
}

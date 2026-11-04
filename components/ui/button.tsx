import type { ComponentProps } from "react";
import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "default" | "small";

export type ButtonProps = Omit<ComponentProps<"button">, "className" | "style"> & {
  /** primary is for the one action a screen is about (Approve). Defaults to secondary. */
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "secondary", size = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={`${size === "small" ? "text-small" : "text-body"} ${styles.button}`}
      data-variant={variant}
      data-size={size}
    />
  );
}

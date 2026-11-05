import type { ComponentProps } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./button.module.css";

export type IconButtonProps = Omit<ComponentProps<"button">, "className" | "style" | "children"> & {
  icon: IconName;
  /** The button's name. Required: the icon has no words. */
  "aria-label": string;
};

/**
 * A round secondary button holding one icon, with the same chrome as Button
 * (raised, neutral, fully rounded). For header actions such as "Open queue"
 * and a Sheet's close; anything that approves stays a labelled Button.
 */
export function IconButton({ icon, type = "button", ...props }: IconButtonProps) {
  return (
    <button type={type} {...props} className={styles.button} data-variant="secondary" data-shape="icon">
      <Icon name={icon} />
    </button>
  );
}

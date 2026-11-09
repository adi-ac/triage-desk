import type { ComponentProps } from "react";
import styles from "./tag.module.css";

/**
 * ai and human follow the trust language: the model is pencil (the soft
 * gray fill), a person is ink (petrol).
 */
export type TagTone = "neutral" | "warning" | "success" | "ai" | "human";

export type TagProps = Omit<ComponentProps<"span">, "className" | "style"> & {
  tone?: TagTone;
};

export function Tag({ tone = "neutral", ...props }: TagProps) {
  return <span {...props} className={styles.tag} data-tone={tone} />;
}

import type { ComponentProps, ReactNode } from "react";
import styles from "./banner.module.css";

/**
 * info is gray, not petrol: petrol already means "a person did this" and
 * "fine to go ahead".
 */
export type BannerTone = "info" | "warning" | "error";

export type BannerProps = Omit<ComponentProps<"div">, "className" | "style" | "title"> & {
  tone?: BannerTone;
  /** The point in a few words. Children add detail. */
  title: string;
  /** Usually a small Button. */
  action?: ReactNode;
};

export function Banner({ tone = "info", title, action, children, ...props }: BannerProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} {...props} className={styles.banner} data-tone={tone}>
      <div className={styles.text}>
        <p className={`text-body-strong ${styles.title}`}>{title}</p>
        {children && <div className={`text-small ${styles.body}`}>{children}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

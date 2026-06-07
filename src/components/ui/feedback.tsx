import type { ReactNode } from "react";

import styles from "./feedback.module.css";

export function Spinner({ label = "載入中…" }: { label?: string }) {
  return (
    <div className={styles.spinnerWrap} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.spinnerLabel}>{label}</span>
    </div>
  );
}

interface MessageStateProps {
  title: string;
  description?: ReactNode;
  tone?: "muted" | "error";
  action?: ReactNode;
}

/** 通用空狀態 / 錯誤狀態。 */
export function MessageState({
  title,
  description,
  tone = "muted",
  action,
}: MessageStateProps) {
  return (
    <div className={styles.message} data-tone={tone}>
      <p className={styles.messageTitle}>{title}</p>
      {description ? <p className={styles.messageDesc}>{description}</p> : null}
      {action ? <div className={styles.messageAction}>{action}</div> : null}
    </div>
  );
}

/** 表格載入骨架。 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={styles.skeletonRow}>
          {Array.from({ length: cols }).map((__, c) => (
            <span key={c} className={styles.skeletonCell} />
          ))}
        </div>
      ))}
    </div>
  );
}

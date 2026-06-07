import type { Trend } from "@/lib/format";

import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: string;
  trend?: Trend;
  hint?: string;
  /** 視覺強調（用於主要指標，放大字級） */
  emphasis?: boolean;
}

export function StatCard({
  label,
  value,
  trend = "neutral",
  hint,
  emphasis = false,
}: StatCardProps) {
  return (
    <div className={styles.stat} data-emphasis={emphasis || undefined}>
      <span className={styles.label}>{label}</span>
      <span className={`${styles.value} num`} data-trend={trend}>
        {value}
      </span>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </div>
  );
}

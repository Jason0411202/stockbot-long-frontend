import type { Trend } from "@/lib/format";

import styles from "./Badge.module.css";

interface TrendBadgeProps {
  trend: Trend;
  children: React.ReactNode;
}

/** 損益語意色徽章：profit（綠）/ loss（紅）/ neutral（灰）。 */
export function TrendBadge({ trend, children }: TrendBadgeProps) {
  return (
    <span className={`${styles.badge} num`} data-trend={trend}>
      {children}
    </span>
  );
}

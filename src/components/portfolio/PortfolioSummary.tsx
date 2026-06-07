import { StatCard } from "@/components/ui";
import { formatCurrency, formatPercent, formatSignedNumber, trendOf } from "@/lib/format";
import type { PortfolioSummary as Summary } from "@/lib/summary";

import styles from "./PortfolioSummary.module.css";

interface PortfolioSummaryProps {
  summary: Summary;
  /** 損益標籤：未實現用「預估」，已實現用實際 */
  variant: "unrealized" | "realized";
}

export function PortfolioSummary({ summary, variant }: PortfolioSummaryProps) {
  const plLabel = variant === "unrealized" ? "總預估損益" : "總損益";
  const rateLabel = variant === "unrealized" ? "總預估損益率" : "總損益率";
  const trend = trendOf(summary.totalProfitLoss);

  return (
    <div className={styles.grid}>
      <StatCard label="總投資成本" value={formatCurrency(summary.totalCost)} />
      <StatCard
        label={plLabel}
        value={formatSignedNumber(summary.totalProfitLoss)}
        trend={trend}
        emphasis
      />
      <StatCard
        label={rateLabel}
        value={formatPercent(summary.returnRate)}
        trend={trend}
      />
    </div>
  );
}

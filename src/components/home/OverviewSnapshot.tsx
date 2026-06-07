"use client";

import { StatCard } from "@/components/ui";
import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { useUnrealized } from "@/hooks/usePortfolio";
import { formatCurrency, formatPercent, formatSignedNumber, trendOf } from "@/lib/format";
import { computePortfolioSummary } from "@/lib/summary";

import styles from "./OverviewSnapshot.module.css";

export function OverviewSnapshot() {
  const { rows, error, isLoading } = useUnrealized();

  if (isLoading) return <TableSkeleton rows={1} cols={3} />;

  if (error) {
    return (
      <MessageState
        tone="error"
        title="無法連線後端"
        description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。"
      />
    );
  }

  const summary = computePortfolioSummary(rows ?? []);
  const trend = trendOf(summary.totalProfitLoss);
  const positions = rows?.length ?? 0;

  return (
    <div className={styles.grid}>
      <StatCard label="目前持倉檔數" value={`${positions}`} hint="未實現部位" />
      <StatCard label="總投資成本" value={formatCurrency(summary.totalCost)} />
      <StatCard
        label="總預估損益"
        value={formatSignedNumber(summary.totalProfitLoss)}
        trend={trend}
        emphasis
      />
      <StatCard
        label="總預估損益率"
        value={formatPercent(summary.returnRate)}
        trend={trend}
      />
    </div>
  );
}

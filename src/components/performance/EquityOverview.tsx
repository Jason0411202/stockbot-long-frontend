import type { PerformanceSummary } from "@/lib/api/types";
import {
  formatCurrency,
  formatPercent,
  formatSignedNumber,
  trendOf,
} from "@/lib/format";

import styles from "./performance.module.css";

interface EquityOverviewProps {
  summary: PerformanceSummary;
}

/** 實盤總權益 bento：總權益（主格）＋ 報酬率、總損益、四個帳本副格。 */
export function EquityOverview({ summary }: EquityOverviewProps) {
  const trend = trendOf(summary.total_pnl);

  return (
    <div className={styles.equity}>
      <div className={styles.equityHero}>
        <span className={styles.liveTag}>
          <span className={styles.liveDot} aria-hidden="true" />
          實盤總權益 · LIVE
        </span>
        <span className={`${styles.equityValue} num`}>
          {formatCurrency(summary.total_equity)}
        </span>
        <div className={styles.equityFooter}>
          <span className={`${styles.returnPill} num`} data-trend={trend}>
            <span className={styles.returnPillLabel}>總報酬率</span>
            {formatPercent(summary.total_return_rate)}
          </span>
          <span className={styles.pnlText}>
            總損益{" "}
            <strong className="num" data-trend={trend}>
              {formatSignedNumber(summary.total_pnl, 0)}
            </strong>
          </span>
        </div>
      </div>

      <MiniCard
        label="投入本金"
        value={formatCurrency(summary.total_invested)}
        hint={
          summary.monthly_contribution > 0
            ? `期初 ${formatCurrency(summary.initial_cash)} ＋ 每月 ${formatCurrency(
                summary.monthly_contribution,
              )}`
            : `期初一次性投入`
        }
      />
      <MiniCard label="持股市值" value={formatCurrency(summary.holding_value)} />
      <MiniCard
        label="已實現損益"
        value={formatSignedNumber(summary.realized_pnl, 0)}
        trend={trendOf(summary.realized_pnl)}
      />
      <MiniCard
        label="未實現損益"
        value={formatSignedNumber(summary.unrealized_pnl, 0)}
        trend={trendOf(summary.unrealized_pnl)}
      />
    </div>
  );
}

interface MiniCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: ReturnType<typeof trendOf>;
}

function MiniCard({ label, value, hint, trend = "neutral" }: MiniCardProps) {
  return (
    <div className={styles.miniCard}>
      <span className={styles.miniLabel}>{label}</span>
      <span className={`${styles.miniValue} num`} data-trend={trend}>
        {value}
      </span>
      {hint ? <span className={styles.miniHint}>{hint}</span> : null}
    </div>
  );
}

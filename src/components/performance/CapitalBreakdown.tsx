import type { PerformanceSummary } from "@/lib/api/types";
import { formatCurrency, formatSignedNumber, type Trend, trendOf } from "@/lib/format";

import styles from "./performance.module.css";

interface CapitalBreakdownProps {
  summary: PerformanceSummary;
}

/** 資金與帳本明細：本金注入（外部資金）＋ 實盤帳本現況。 */
export function CapitalBreakdown({ summary }: CapitalBreakdownProps) {
  return (
    <dl className={styles.metricGrid}>
      <p className={styles.metricGroupLabel}>本金注入（外部資金）</p>
      <Metric label="期初本金" value={formatCurrency(summary.initial_cash)} />
      <Metric
        label="每月定額"
        value={
          summary.monthly_contribution > 0
            ? formatCurrency(summary.monthly_contribution)
            : "未啟用"
        }
      />
      <Metric label="累計注資" value={formatCurrency(summary.total_contributed)} />
      <Metric label="投入本金合計" value={formatCurrency(summary.total_invested)} />

      <p className={styles.metricGroupLabel}>實盤帳本現況</p>
      <Metric label="閒置現金" value={formatCurrency(summary.current_cash)} />
      <Metric label="持股市值" value={formatCurrency(summary.holding_value)} />
      <Metric
        label="已實現損益"
        value={formatSignedNumber(summary.realized_pnl, 0)}
        trend={trendOf(summary.realized_pnl)}
      />
      <Metric
        label="未實現損益"
        value={formatSignedNumber(summary.unrealized_pnl, 0)}
        trend={trendOf(summary.unrealized_pnl)}
      />
    </dl>
  );
}

interface MetricProps {
  label: string;
  value: string;
  trend?: Trend;
}

function Metric({ label, value, trend = "neutral" }: MetricProps) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd data-trend={trend}>{value}</dd>
    </div>
  );
}

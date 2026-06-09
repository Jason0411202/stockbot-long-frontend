import type { PerformanceSummary } from "@/lib/api/types";
import { formatCurrency, formatPercentPlain, toFiniteNumber } from "@/lib/format";

import styles from "./performance.module.css";

interface AssetAllocationProps {
  summary: PerformanceSummary;
}

/** 把後端佔比夾到 [0, 100]，避免邊界值（負/超過 100）撐破堆疊條。 */
function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

/**
 * 資產配置：持股市值 vs 未投入股市的預備現金，及兩者佔總資產的比例。
 * 一條堆疊條 + 兩列明細，讓「錢有多少在場上、多少在場邊」一眼看懂。
 */
export function AssetAllocation({ summary }: AssetAllocationProps) {
  const holdingPct = clampRatio(toFiniteNumber(summary.holding_ratio) ?? 0);
  const cashPct = clampRatio(toFiniteNumber(summary.cash_ratio) ?? 0);
  // 條寬以兩者相對比例正規化，確保視覺上恰好填滿（總權益<=0 時兩者皆 0）。
  const total = holdingPct + cashPct;
  const holdingWidth = total > 0 ? (holdingPct / total) * 100 : 0;
  const cashWidth = total > 0 ? (cashPct / total) * 100 : 0;

  return (
    <div className={styles.alloc}>
      <div className={styles.allocHead}>
        <span className={styles.allocTitle}>目前資產配置</span>
        <span className={`${styles.allocTotal} num`}>
          總資產 {formatCurrency(summary.total_equity)}
        </span>
      </div>

      <div
        className={styles.allocBar}
        role="img"
        aria-label={`持股 ${formatPercentPlain(holdingPct)}，預備現金 ${formatPercentPlain(cashPct)}`}
      >
        <span
          className={styles.allocSegHolding}
          style={{ width: `${holdingWidth}%` }}
        />
        <span className={styles.allocSegCash} style={{ width: `${cashWidth}%` }} />
      </div>

      <dl className={styles.allocLegend}>
        <AllocRow
          variant="holding"
          label="持股市值"
          amount={formatCurrency(summary.holding_value)}
          pct={formatPercentPlain(summary.holding_ratio)}
        />
        <AllocRow
          variant="cash"
          label="預備現金"
          hint="未投入股市"
          amount={formatCurrency(summary.current_cash)}
          pct={formatPercentPlain(summary.cash_ratio)}
        />
      </dl>
    </div>
  );
}

interface AllocRowProps {
  variant: "holding" | "cash";
  label: string;
  hint?: string;
  amount: string;
  pct: string;
}

function AllocRow({ variant, label, hint, amount, pct }: AllocRowProps) {
  return (
    <div className={styles.allocRow}>
      <dt className={styles.allocRowLabel}>
        <span className={styles.allocDot} data-variant={variant} aria-hidden="true" />
        {label}
        {hint ? <span className={styles.allocRowHint}>{hint}</span> : null}
      </dt>
      <dd className={styles.allocRowValue}>
        <span className={`${styles.allocPct} num`} data-variant={variant}>
          {pct}
        </span>
        <span className={`${styles.allocAmount} num`}>{amount}</span>
      </dd>
    </div>
  );
}

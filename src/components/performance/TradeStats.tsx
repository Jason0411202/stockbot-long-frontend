import type { BacktestPerformance } from "@/lib/api/types";
import {
  formatCurrency,
  formatMultiple,
  formatNumber,
  formatRatioPercent,
} from "@/lib/format";

import styles from "./performance.module.css";

interface TradeStatsProps {
  backtest: BacktestPerformance;
}

/** 回測期的策略交易統計，以及 walk-forward 多視窗中位指標。 */
export function TradeStats({ backtest }: TradeStatsProps) {
  const wf = backtest.walk_forward;
  return (
    <dl className={styles.metricGrid}>
      <p className={styles.metricGroupLabel}>策略交易統計（回測期）</p>
      <Metric label="買入次數" value={formatNumber(backtest.buys, 0)} />
      <Metric label="賣出次數" value={formatNumber(backtest.sells, 0)} />
      <Metric label="移動停利" value={formatNumber(backtest.trail_sells, 0)} />
      <Metric label="獲利了結" value={formatNumber(backtest.profit_sells, 0)} />
      <Metric label="現金不足跳過" value={formatNumber(backtest.skipped, 0)} />
      <Metric label="期末現金尾巴" value={formatCurrency(backtest.final_cash)} />

      <p className={styles.metricGroupLabel}>
        Walk-Forward 多視窗中位（{wf.n_windows} 個 {wf.window_months} 月視窗 / 步進{" "}
        {wf.step_months} 月）
      </p>
      <Metric label="中位報酬參與率" value={formatMultiple(wf.ret_participation)} />
      <Metric label="Calmar 勝率" value={formatRatioPercent(wf.calmar_win_rate)} />
      <Metric label="真實擇時率" value={formatRatioPercent(wf.blend_skill_rate)} />
      <Metric label="中位策略 Calmar" value={formatNumber(wf.med_strat_calmar)} />
    </dl>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

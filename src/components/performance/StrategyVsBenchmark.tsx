import type { ArmMetrics, BacktestPerformance } from "@/lib/api/types";
import {
  formatCurrency,
  formatMultiple,
  formatNumber,
  formatRatioPercent,
  toFiniteNumber,
} from "@/lib/format";

import styles from "./performance.module.css";

type Direction = "higher" | "lower" | "none";

interface MetricRow {
  name: string;
  hint?: string;
  /** 取出該指標的原始值（用於判定優勝方與畫 bar） */
  pick: (m: ArmMetrics) => number | null;
  /** 顯示字串 */
  format: (value: number | null) => string;
  /** 哪個方向較好（決定優勝高亮）；none = 純資訊不分勝負 */
  better: Direction;
  /** 是否在 cell 下方畫一條比例 bar（目前用於最大回撤） */
  bar?: boolean;
}

const ROWS: readonly MetricRow[] = [
  {
    name: "期末權益",
    hint: "回測終點總權益",
    pick: (m) => m.final_equity,
    format: (v) => formatCurrency(v),
    better: "higher",
  },
  {
    name: "本金倍數",
    hint: "期末權益 / 投入本金",
    pick: (m) => m.multiple,
    format: (v) => formatMultiple(v),
    better: "higher",
  },
  {
    name: "年化報酬",
    hint: "資金加權 MWR (XIRR)",
    pick: (m) => m.mwr,
    format: (v) => formatRatioPercent(v, true),
    better: "higher",
  },
  {
    name: "最大回撤",
    hint: "NAV 單位淨值",
    pick: (m) => m.max_drawdown,
    format: (v) => formatRatioPercent(v),
    better: "higher", // 回撤 ≤ 0，越接近 0（越大）越好
    bar: true,
  },
  {
    name: "Calmar",
    hint: "報酬 / 最大回撤",
    pick: (m) => m.calmar,
    format: (v) => formatNumber(v),
    better: "higher",
  },
  {
    name: "Sortino",
    hint: "下檔風險調整後報酬",
    pick: (m) => m.sortino,
    format: (v) => formatNumber(v),
    better: "higher",
  },
  {
    name: "平均曝險",
    hint: "資金利用率",
    pick: (m) => m.avg_exposure,
    format: (v) => formatRatioPercent(v),
    better: "none",
  },
];

type Arm = "strategy" | "buy_hold";

function winnerOf(strat: number | null, bh: number | null, better: Direction): Arm | null {
  if (better === "none" || strat === null || bh === null || strat === bh) return null;
  if (better === "higher") return strat > bh ? "strategy" : "buy_hold";
  return strat < bh ? "strategy" : "buy_hold";
}

interface StrategyVsBenchmarkProps {
  backtest: BacktestPerformance;
}

/**
 * 策略 vs 買進持有的全期回測對照表。逐項以語意色高亮優勝方，
 * 最大回撤額外畫出相對比例 bar，讓「風險更低」一眼可見。
 */
export function StrategyVsBenchmark({ backtest }: StrategyVsBenchmarkProps) {
  const { strategy, buy_hold } = backtest;

  // 回撤 bar 的共同基準（兩臂中較深的回撤 = 100% 寬）
  const ddMax = Math.max(
    Math.abs(toFiniteNumber(strategy.max_drawdown) ?? 0),
    Math.abs(toFiniteNumber(buy_hold.max_drawdown) ?? 0),
    1e-9,
  );

  return (
    <div className={styles.compare}>
      <div className={styles.compareHead}>
        <span className={styles.compareHeadMetric}>指標</span>
        <span className={styles.armHead}>
          <span className={styles.armName} data-arm="strategy">
            本策略
          </span>
          <span className={styles.armTag}>regime 感知逢低加碼</span>
        </span>
        <span className={styles.armHead}>
          <span className={styles.armName} data-arm="buy_hold">
            買進持有
          </span>
          <span className={styles.armTag}>資金解鎖即買滿</span>
        </span>
      </div>

      {ROWS.map((row) => {
        const sVal = row.pick(strategy);
        const bVal = row.pick(buy_hold);
        const win = winnerOf(sVal, bVal, row.better);
        return (
          <div key={row.name} className={styles.compareRow}>
            <span className={styles.metricLabel}>
              <span className={styles.metricName}>{row.name}</span>
              {row.hint ? <span className={styles.metricHint}>{row.hint}</span> : null}
            </span>
            <ArmCell
              text={row.format(sVal)}
              win={win === "strategy"}
              bar={row.bar}
              barRatio={Math.abs(toFiniteNumber(sVal) ?? 0) / ddMax}
            />
            <ArmCell
              text={row.format(bVal)}
              win={win === "buy_hold"}
              bar={row.bar}
              barRatio={Math.abs(toFiniteNumber(bVal) ?? 0) / ddMax}
            />
          </div>
        );
      })}

      <p className={styles.compareFoot}>
        回測區間 <strong>{backtest.span_start}</strong> ～{" "}
        <strong>{backtest.span_end}</strong>（約 {formatNumber(backtest.years, 1)} 年），
        投入本金 <strong>{formatCurrency(backtest.total_in)}</strong>。
      </p>
    </div>
  );
}

interface ArmCellProps {
  text: string;
  win: boolean;
  bar?: boolean;
  barRatio: number;
}

function ArmCell({ text, win, bar, barRatio }: ArmCellProps) {
  const width = `${Math.min(Math.max(barRatio, 0), 1) * 100}%`;
  return (
    <span className={styles.cell} data-winner={win || undefined}>
      {text}
      {win ? (
        <span className={styles.winFlag} aria-label="較佳">
          ▲
        </span>
      ) : null}
      {bar ? (
        <span className={styles.bar} aria-hidden="true">
          <span className={styles.barFill} style={{ width }} />
        </span>
      ) : null}
    </span>
  );
}

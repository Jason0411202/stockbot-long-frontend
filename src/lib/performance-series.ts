/**
 * 歷史策略績效「可勾選疊圖」的指標目錄（單一真實來源）。
 *
 * 每個 SeriesDef 同時驅動 checkbox 面板與 chart.js dataset：
 *   - unit 決定畫在哪條 Y 軸（金額／百分比／倍數）
 *   - color 為 canvas 具體色值（canvas 無法解析 CSS 變數）
 *   - accessor 從某日的 PerformanceHistoryPoint 取值；null = 該日無資料（畫成斷點）
 *
 * 對應後端契約見 docs/backend-request-performance-history.md。
 */

import type { PerformanceHistoryPoint } from "./api/types";
import { formatCurrency, formatMultiple, formatPercentPlain } from "./format";

/** Y 軸單位群組。 */
export type SeriesUnit = "twd" | "pct" | "mult";
/** 指標來源分組（共用 / 實盤 / 回測）。 */
export type SeriesSource = "common" | "live" | "backtest";

export interface SeriesDef {
  /** 唯一鍵；對應後端欄位名，亦用於 cookie 與 dataset。 */
  key: string;
  label: string;
  source: SeriesSource;
  unit: SeriesUnit;
  /** canvas 具體色值（hex）。 */
  color: string;
  /** 是否畫成虛線（用於輔助／基準線，如投入本金）。 */
  dash?: boolean;
  accessor: (p: PerformanceHistoryPoint) => number | null;
}

export const SERIES: readonly SeriesDef[] = [
  // ── 共用 ──
  { key: "invested", label: "投入本金", source: "common", unit: "twd", color: "#8b97a8", dash: true, accessor: (p) => p.invested },

  // ── 實盤帳戶 ──
  { key: "total_equity", label: "實盤總權益", source: "live", unit: "twd", color: "#ef4d52", accessor: (p) => p.total_equity },
  { key: "holding_value", label: "持股市值", source: "live", unit: "twd", color: "#f59e0b", accessor: (p) => p.holding_value },
  { key: "cash", label: "預備現金", source: "live", unit: "twd", color: "#fbbf24", accessor: (p) => p.cash },
  { key: "total_pnl", label: "總損益", source: "live", unit: "twd", color: "#fb923c", accessor: (p) => p.total_pnl },
  { key: "realized_pnl", label: "已實現損益", source: "live", unit: "twd", color: "#f472b6", accessor: (p) => p.realized_pnl },
  { key: "unrealized_pnl", label: "未實現損益", source: "live", unit: "twd", color: "#fca5a5", accessor: (p) => p.unrealized_pnl },
  { key: "total_return_rate", label: "報酬率", source: "live", unit: "pct", color: "#ec6cb9", accessor: (p) => p.total_return_rate },
  { key: "cagr", label: "年化報酬", source: "live", unit: "pct", color: "#e879f9", accessor: (p) => p.cagr },
  { key: "max_drawdown", label: "最大回撤", source: "live", unit: "pct", color: "#f87171", accessor: (p) => p.max_drawdown },
  { key: "holding_ratio", label: "持股佔比", source: "live", unit: "pct", color: "#22d3ee", accessor: (p) => p.holding_ratio },
  { key: "cash_ratio", label: "現金佔比", source: "live", unit: "pct", color: "#60a5fa", accessor: (p) => p.cash_ratio },
  { key: "multiple", label: "本金倍數", source: "live", unit: "mult", color: "#a78bfa", accessor: (p) => p.multiple },

  // ── 回測（模擬） ──
  { key: "strat_equity", label: "策略權益", source: "backtest", unit: "twd", color: "#2dd4bf", accessor: (p) => p.strat_equity },
  { key: "bh_equity", label: "買進持有權益", source: "backtest", unit: "twd", color: "#94a3b8", accessor: (p) => p.bh_equity },
  { key: "strat_return_rate", label: "策略報酬率", source: "backtest", unit: "pct", color: "#34d399", accessor: (p) => p.strat_return_rate },
  { key: "bh_return_rate", label: "買進持有報酬率", source: "backtest", unit: "pct", color: "#cbd5e1", accessor: (p) => p.bh_return_rate },
  { key: "strat_drawdown", label: "策略回撤", source: "backtest", unit: "pct", color: "#4ade80", accessor: (p) => p.strat_drawdown },
  { key: "bh_drawdown", label: "買進持有回撤", source: "backtest", unit: "pct", color: "#9ca3af", accessor: (p) => p.bh_drawdown },
  { key: "strat_cagr", label: "策略年化", source: "backtest", unit: "pct", color: "#a3e635", accessor: (p) => p.strat_cagr },
  { key: "strat_multiple", label: "策略倍數", source: "backtest", unit: "mult", color: "#818cf8", accessor: (p) => p.strat_multiple },
  { key: "bh_multiple", label: "買進持有倍數", source: "backtest", unit: "mult", color: "#c084fc", accessor: (p) => p.bh_multiple },
];

/** key → SeriesDef 快取查表。 */
export const SERIES_BY_KEY: Readonly<Record<string, SeriesDef>> = Object.fromEntries(
  SERIES.map((s) => [s.key, s]),
);

/** 無 cookie 時的預設勾選：權益主線（皆為金額軸，畫面乾淨）。 */
export const DEFAULT_SELECTED: readonly string[] = [
  "total_equity",
  "strat_equity",
  "bh_equity",
  "invested",
];

export const SOURCE_LABELS: Readonly<Record<SeriesSource, string>> = {
  common: "共用",
  live: "實盤帳戶",
  backtest: "回測（模擬）",
};

export const UNIT_LABELS: Readonly<Record<SeriesUnit, string>> = {
  twd: "金額",
  pct: "百分比",
  mult: "倍數",
};

/** 依單位格式化顯示值（tooltip 用）；null/非數字回傳破折號。 */
export function formatByUnit(value: number | null | undefined, unit: SeriesUnit): string {
  if (value === null || value === undefined) return "—";
  if (unit === "twd") return formatCurrency(value);
  if (unit === "mult") return formatMultiple(value);
  return formatPercentPlain(value, 2);
}

/** 過濾掉未知的 key、保序去重；常用於清洗 cookie 還原的勾選集合。 */
export function sanitizeSelection(keys: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (SERIES_BY_KEY[key] && !seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

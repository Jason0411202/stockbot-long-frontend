/**
 * 歷史權益折線圖的純資料工具：方向判定（漲/跌上色）與區間報酬率。
 * 邏輯抽成純函式以便單元測試；圖表元件只負責把結果餵給 chart.js。
 */

import type { Trend } from "./format";

/** 任何帶 total_equity 的時間點（實盤每日權益 / 回測權益皆可）。 */
interface EquityLike {
  total_equity: number;
}

/**
 * 期末相對期初的方向，用於替整條權益線上色（台股慣例：漲=紅 profit、跌=綠 loss）。
 * 樣本不足、非有限值或持平時回傳 neutral。
 */
export function equityTrend(points: readonly EquityLike[]): Trend {
  if (points.length < 2) return "neutral";
  const first = points[0].total_equity;
  const last = points[points.length - 1].total_equity;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === last) {
    return "neutral";
  }
  return last > first ? "profit" : "loss";
}

/**
 * 區間報酬率（百分比）= 期末/期初 − 1，例如 1.25 → 25。
 * 樣本不足、期初為 0 或非有限值時回傳 null。
 */
export function equityChangePct(points: readonly EquityLike[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].total_equity;
  const last = points[points.length - 1].total_equity;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  return (last / first - 1) * 100;
}

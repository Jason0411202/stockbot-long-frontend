/**
 * 歷史權益折線圖的純資料工具：時間區間過濾、方向判定（漲/跌上色）、區間報酬率與高低。
 * 邏輯抽成純函式以便單元測試；圖表元件只負責把結果餵給 chart.js。
 */

import type { TimeRange } from "./chart-data";
import type { Trend } from "./format";

/**
 * 依時間範圍過濾（相對序列「最後一筆」的日期，而非系統當下時間）。
 * 回測曲線終點是過去某日（span_end），故不能用 now 當基準，否則短區間會全空。
 * 序列須為日期升冪；"all" 或空序列原樣回傳。
 */
export function filterFromEnd<T extends { date: string }>(
  points: readonly T[],
  range: TimeRange,
): T[] {
  if (range === "all" || points.length === 0) return [...points];

  const last = new Date(points[points.length - 1].date);
  const limit = new Date(last);
  switch (range) {
    case "1m":
      limit.setMonth(last.getMonth() - 1);
      break;
    case "3m":
      limit.setMonth(last.getMonth() - 3);
      break;
    case "6m":
      limit.setMonth(last.getMonth() - 6);
      break;
    case "1y":
      limit.setFullYear(last.getFullYear() - 1);
      break;
    case "3y":
      limit.setFullYear(last.getFullYear() - 3);
      break;
  }
  return points.filter((p) => new Date(p.date) >= limit);
}

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

/**
 * 序列中 total_equity 的最高與最低值（供區間統計顯示）。
 * 空序列或全非有限值時回傳 null。
 */
export function equityExtent(
  points: readonly EquityLike[],
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    const v = p.total_equity;
    if (!Number.isFinite(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

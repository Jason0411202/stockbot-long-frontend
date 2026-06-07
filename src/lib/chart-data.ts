/**
 * 個股歷史圖的資料整理（移植自舊 [stockId].js + helper.js 的合併邏輯）。
 *
 * 把後端三支端點的結果在前端合併成「收盤價序列 + 各日的買/賣標記」，
 * 取代舊版在 build-time 抓後端的做法（改為 runtime 抓）。所有函式皆為純函式，易測試。
 */

import type {
  RealizedGainLoss,
  StockHistoryPoint,
  UnrealizedGainLoss,
} from "./api/types";

export interface MergedHistoryPoint extends StockHistoryPoint {
  /** 該日的未實現買入成本（未獲利了結的買點），無則 0 */
  unrealizedInvestmentCost: number;
  /** 該日的已實現買入成本（已獲利了結的買點），無則 0 */
  realizedInvestmentCost: number;
  /** 該日的已實現賣出收入加總（賣點），無則 0 */
  realizedRevenue: number;
}

export type TimeRange = "1m" | "3m" | "6m" | "1y" | "3y" | "all";

export const TIME_RANGES: readonly { value: TimeRange; label: string }[] = [
  { value: "1m", label: "1個月" },
  { value: "3m", label: "3個月" },
  { value: "6m", label: "6個月" },
  { value: "1y", label: "1年" },
  { value: "3y", label: "3年" },
  { value: "all", label: "全部" },
];

/**
 * 把歷史收盤序列與該股的買/賣交易合併。
 * - 未實現：依 transaction_date 對應 investment_cost
 * - 已實現買入：依 buy_date 對應 investment_cost
 * - 已實現賣出：依 sell_date 加總 revenue
 */
export function mergeHistoryWithTrades(
  history: readonly StockHistoryPoint[],
  unrealized: readonly UnrealizedGainLoss[],
  realized: readonly RealizedGainLoss[],
  stockId: string,
): MergedHistoryPoint[] {
  const unrealizedByDate = new Map<string, number>();
  for (const row of unrealized) {
    if (row.stock_id === stockId) {
      unrealizedByDate.set(row.transaction_date, row.investment_cost);
    }
  }

  const realizedBuyByDate = new Map<string, number>();
  const realizedSellRevenueByDate = new Map<string, number>();
  for (const row of realized) {
    if (row.stock_id !== stockId) continue;
    realizedBuyByDate.set(row.buy_date, row.investment_cost);
    realizedSellRevenueByDate.set(
      row.sell_date,
      (realizedSellRevenueByDate.get(row.sell_date) ?? 0) + row.revenue,
    );
  }

  return history.map((point) => ({
    ...point,
    unrealizedInvestmentCost: unrealizedByDate.get(point.date) ?? 0,
    realizedInvestmentCost: realizedBuyByDate.get(point.date) ?? 0,
    realizedRevenue: realizedSellRevenueByDate.get(point.date) ?? 0,
  }));
}

/** 依使用者選的時間範圍過濾資料（"all" 不過濾）。 */
export function filterByRange(
  points: readonly MergedHistoryPoint[],
  range: TimeRange,
  now: Date = new Date(),
): MergedHistoryPoint[] {
  if (range === "all") return [...points];

  const limit = new Date(now);
  switch (range) {
    case "1m":
      limit.setMonth(now.getMonth() - 1);
      break;
    case "3m":
      limit.setMonth(now.getMonth() - 3);
      break;
    case "6m":
      limit.setMonth(now.getMonth() - 6);
      break;
    case "1y":
      limit.setFullYear(now.getFullYear() - 1);
      break;
    case "3y":
      limit.setFullYear(now.getFullYear() - 3);
      break;
  }

  return points.filter((p) => new Date(p.date) >= limit);
}

/** 取得三類成本欄位的數值範圍，用於動態決定點大小。 */
export function costRange(points: readonly MergedHistoryPoint[]): {
  min: number;
  max: number;
} {
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    for (const v of [
      p.unrealizedInvestmentCost,
      p.realizedInvestmentCost,
      p.realizedRevenue,
    ]) {
      if (v > max) max = v;
      if (v >= 1 && v < min) min = v; // 與舊版一致：min 只看 >= 1 的值
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { min: 0, max: 0 };
  return { min, max };
}

/** 線性插值決定點半徑；範圍退化時回傳 base。 */
export function calculatePointSize(
  value: number,
  min: number,
  max: number,
  base = 5,
  span = 7,
): number {
  if (max === min) return base + span / 2;
  return base + ((value - min) / (max - min)) * span;
}

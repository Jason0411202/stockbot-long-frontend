/** 後端業務端點的型別化包裝（路徑對應 internal/server/server.go）。 */

import { apiGet } from "./client";
import type {
  PerformanceSummary,
  RealizedGainLoss,
  StockHistoryPoint,
  StockStatistic,
  UnrealizedGainLoss,
} from "./types";

export const ENDPOINTS = {
  unrealized: "/api/get_unrealized_gains_losses",
  realized: "/api/get_realized_gains_losses",
  statistics: "/api/get_stock_statistic_data",
  history: "/api/get_stock_history_data",
  performance: "/api/get_performance_summary",
} as const;

export function getUnrealizedGainsLosses(
  signal?: AbortSignal,
): Promise<UnrealizedGainLoss[]> {
  return apiGet<UnrealizedGainLoss[]>(ENDPOINTS.unrealized, signal);
}

export function getRealizedGainsLosses(
  signal?: AbortSignal,
): Promise<RealizedGainLoss[]> {
  return apiGet<RealizedGainLoss[]>(ENDPOINTS.realized, signal);
}

export function getStockStatistics(signal?: AbortSignal): Promise<StockStatistic[]> {
  return apiGet<StockStatistic[]>(ENDPOINTS.statistics, signal);
}

/**
 * 取得單一股票的收盤價歷史序列。
 * 注意：後端 query 參數名為 `stockId`（camelCase，見 controller.go）。
 */
export function getStockHistory(
  stockId: string,
  signal?: AbortSignal,
): Promise<StockHistoryPoint[]> {
  const query = new URLSearchParams({ stockId });
  return apiGet<StockHistoryPoint[]>(`${ENDPOINTS.history}?${query.toString()}`, signal);
}

/** 取得策略績效摘要（本金明細 + 實盤現況 + 回測 scorecard）。 */
export function getPerformanceSummary(
  signal?: AbortSignal,
): Promise<PerformanceSummary> {
  return apiGet<PerformanceSummary>(ENDPOINTS.performance, signal);
}

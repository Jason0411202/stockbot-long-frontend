/** 後端業務端點的型別化包裝（路徑對應 internal/server/server.go）。 */

import { apiGet } from "./client";
import type {
  LiveEquityPoint,
  PerformanceHistoryPoint,
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
  equityHistory: "/api/get_equity_history",
  performanceHistory: "/api/get_performance_history",
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

/** 取得實盤每日權益歷史（真實帳戶總權益時間序列，供歷史權益折線圖）。 */
export function getEquityHistory(
  signal?: AbortSignal,
): Promise<LiveEquityPoint[]> {
  return apiGet<LiveEquityPoint[]>(ENDPOINTS.equityHistory, signal);
}

/**
 * 取得統一的逐日績效時間序列（回測 + 實盤同一條時間軸），供歷史頁可勾選疊圖。
 * 契約見 docs/backend-request-performance-history.md。
 */
export function getPerformanceHistory(
  signal?: AbortSignal,
): Promise<PerformanceHistoryPoint[]> {
  return apiGet<PerformanceHistoryPoint[]>(ENDPOINTS.performanceHistory, signal);
}

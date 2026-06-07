"use client";

import useSWR from "swr";

import {
  getRealizedGainsLosses,
  getStockHistory,
  getUnrealizedGainsLosses,
} from "@/lib/api/endpoints";
import { mergeHistoryWithTrades, type MergedHistoryPoint } from "@/lib/chart-data";

async function fetchStockChart(stockId: string): Promise<MergedHistoryPoint[]> {
  // 三支端點並行抓取，避免 request waterfall。
  const [history, unrealized, realized] = await Promise.all([
    getStockHistory(stockId),
    getUnrealizedGainsLosses(),
    getRealizedGainsLosses(),
  ]);
  return mergeHistoryWithTrades(history, unrealized, realized, stockId);
}

export function useStockChart(stockId: string | undefined) {
  const { data, error, isLoading } = useSWR<MergedHistoryPoint[]>(
    stockId ? ["stock_chart", stockId] : null,
    () => fetchStockChart(stockId as string),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return { points: data, error, isLoading };
}

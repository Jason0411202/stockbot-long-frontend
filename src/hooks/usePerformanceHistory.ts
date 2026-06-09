"use client";

import useSWR from "swr";

import { getPerformanceHistory } from "@/lib/api/endpoints";
import type { PerformanceHistoryPoint } from "@/lib/api/types";

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;

/** 取得統一的逐日績效時間序列（回測 + 實盤同一條時間軸），供歷史頁可勾選疊圖。 */
export function usePerformanceHistory() {
  const { data, error, isLoading } = useSWR<PerformanceHistoryPoint[]>(
    "performance_history",
    () => getPerformanceHistory(),
    SWR_OPTIONS,
  );
  return { points: data, error, isLoading };
}

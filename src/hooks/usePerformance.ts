"use client";

import useSWR from "swr";

import { getPerformanceSummary } from "@/lib/api/endpoints";
import type { PerformanceSummary } from "@/lib/api/types";

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;

/** 取得策略績效摘要（本金明細 + 實盤現況 + 回測 scorecard）。 */
export function usePerformanceSummary() {
  const { data, error, isLoading } = useSWR<PerformanceSummary>(
    "performance_summary",
    () => getPerformanceSummary(),
    SWR_OPTIONS,
  );
  return { summary: data, error, isLoading };
}

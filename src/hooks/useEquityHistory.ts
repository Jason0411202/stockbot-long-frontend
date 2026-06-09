"use client";

import useSWR from "swr";

import { getEquityHistory } from "@/lib/api/endpoints";
import type { LiveEquityPoint } from "@/lib/api/types";

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;

/** 取得實盤每日權益歷史（真實帳戶總權益時間序列，供歷史權益折線圖）。 */
export function useEquityHistory() {
  const { data, error, isLoading } = useSWR<LiveEquityPoint[]>(
    "equity_history",
    () => getEquityHistory(),
    SWR_OPTIONS,
  );
  return { points: data, error, isLoading };
}

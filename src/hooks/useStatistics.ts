"use client";

import useSWR from "swr";

import { getStockStatistics } from "@/lib/api/endpoints";
import type { StockStatistic } from "@/lib/api/types";

export function useStockStatistics() {
  const { data, error, isLoading } = useSWR<StockStatistic[]>(
    "stock_statistic_data",
    () => getStockStatistics(),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );
  return { rows: data, error, isLoading };
}

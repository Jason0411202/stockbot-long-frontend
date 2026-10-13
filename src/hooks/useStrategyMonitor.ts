"use client";

import useSWR from "swr";
import { ENDPOINTS, getStrategyMonitor } from "@/lib/api/endpoints";
import type { StrategyMonitor } from "@/lib/api/strategy-types";

export function useStrategyMonitor() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<StrategyMonitor>(
    ENDPOINTS.strategyMonitor,
    () => getStrategyMonitor(),
    { revalidateOnFocus: true, refreshInterval: 60_000, shouldRetryOnError: false },
  );
  return { snapshot: data, error, isLoading, isValidating, refresh: () => mutate() };
}

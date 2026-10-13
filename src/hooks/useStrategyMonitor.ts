"use client";

import useSWR from "swr";
import { ENDPOINTS, getStrategyMonitor, getStrategyMonitorHistory } from "@/lib/api/endpoints";
import type { StrategyMonitor, StrategyMonitorHistory } from "@/lib/api/strategy-types";

export function useStrategyMonitor(date = "") {
  const { data, error, isLoading, isValidating, mutate } = useSWR<StrategyMonitor>(
    [ENDPOINTS.strategyMonitor, date],
    () => getStrategyMonitor(date),
    { revalidateOnFocus: !date, refreshInterval: date ? 0 : 60_000, shouldRetryOnError: false, keepPreviousData: false },
  );
  return { snapshot: data, error, isLoading, isValidating, refresh: () => mutate() };
}

export function useStrategyMonitorHistory() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<StrategyMonitorHistory>(
    ENDPOINTS.strategyMonitorHistory,
    () => getStrategyMonitorHistory(),
    { revalidateOnFocus: true, refreshInterval: (history) => history?.backfill.status === "complete" ? 60_000 : 10_000, shouldRetryOnError: false },
  );
  return { history: data, error, isLoading, isValidating, refresh: () => mutate() };
}

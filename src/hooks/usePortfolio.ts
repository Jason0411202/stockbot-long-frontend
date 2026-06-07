"use client";

import useSWR from "swr";

import {
  getRealizedGainsLosses,
  getUnrealizedGainsLosses,
} from "@/lib/api/endpoints";
import type { RealizedGainLoss, UnrealizedGainLoss } from "@/lib/api/types";

const SWR_OPTIONS = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
} as const;

export function useUnrealized() {
  const { data, error, isLoading } = useSWR<UnrealizedGainLoss[]>(
    "unrealized_gains_losses",
    () => getUnrealizedGainsLosses(),
    SWR_OPTIONS,
  );
  return { rows: data, error, isLoading };
}

export function useRealized() {
  const { data, error, isLoading } = useSWR<RealizedGainLoss[]>(
    "realized_gains_losses",
    () => getRealizedGainsLosses(),
    SWR_OPTIONS,
  );
  return { rows: data, error, isLoading };
}

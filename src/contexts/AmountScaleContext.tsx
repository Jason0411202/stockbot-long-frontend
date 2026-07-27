"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { readCookie, writeCookie } from "@/lib/cookie";
import { normalizeAmountScale } from "@/lib/amount-scale";

export const AMOUNT_SCALE_COOKIE = "amount_display_scale";
export const DEFAULT_AMOUNT_SCALE = 1;

interface AmountScaleContextValue {
  scale: number;
  setScale: (scale: number) => boolean;
}

const AmountScaleContext = createContext<AmountScaleContextValue | null>(null);

/**
 * 金額顯示倍率的全域狀態。
 *
 * 首次 SSR/CSR 都使用 1，掛載後才讀 cookie，避免 hydration 不一致。
 * 倍率只存在瀏覽器 cookie，不會送往任何應用程式 API。
 */
export function AmountScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState(DEFAULT_AMOUNT_SCALE);

  useEffect(() => {
    const restored = normalizeAmountScale(readCookie(AMOUNT_SCALE_COOKIE));
    if (restored !== null) setScaleState(restored);
  }, []);

  const setScale = useCallback((nextScale: number) => {
    const normalized = normalizeAmountScale(nextScale);
    if (normalized === null) return false;

    setScaleState(normalized);
    writeCookie(AMOUNT_SCALE_COOKIE, String(normalized));
    return true;
  }, []);

  const value = useMemo(() => ({ scale, setScale }), [scale, setScale]);

  return <AmountScaleContext.Provider value={value}>{children}</AmountScaleContext.Provider>;
}

export function useAmountScale(): AmountScaleContextValue {
  const context = useContext(AmountScaleContext);
  if (!context) {
    throw new Error("useAmountScale 必須在 AmountScaleProvider 內使用");
  }
  return context;
}

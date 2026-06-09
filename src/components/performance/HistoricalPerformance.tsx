"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { RangeSelector } from "@/components/stocks/RangeSelector";
import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { usePerformanceHistory } from "@/hooks/usePerformanceHistory";
import { filterFromEnd, type TimeRange } from "@/lib/chart-data";
import { readCookie, writeCookie } from "@/lib/cookie";
import {
  DEFAULT_SELECTED,
  SERIES_BY_KEY,
  sanitizeSelection,
} from "@/lib/performance-series";

import { PerformanceOverlayChart } from "./PerformanceOverlayChart";
import { SeriesToggles } from "./SeriesToggles";
import styles from "./performance.module.css";

const COOKIE_KEY = "perf_overlay_series";

/**
 * 歷史策略績效：所有「有時間軸」的指標疊在同一張折線圖，使用者自選要看哪些線交叉比對。
 * 回測與實盤共享同一條時間軸（回測每日依實盤重跑），不拆兩支。勾選狀態以 cookie 記住。
 */
export function HistoricalPerformance() {
  const { points, error, isLoading } = usePerformanceHistory();
  const [range, setRange] = useState<TimeRange>("all");
  const [selected, setSelected] = useState<string[]>(() => [...DEFAULT_SELECTED]);
  const hydrated = useRef(false);

  // 掛載後才從 cookie 還原勾選：首次 render 用預設值，避免 SSR/CSR hydration 不一致。
  useEffect(() => {
    const raw = readCookie(COOKIE_KEY);
    if (raw !== null) {
      const restored = sanitizeSelection(raw.split(","));
      setSelected(restored); // 允許空集合（使用者全取消）
    }
    hydrated.current = true;
  }, []);

  // 勾選變動後寫回 cookie（跳過 hydration 完成前的首次 effect）。
  useEffect(() => {
    if (!hydrated.current) return;
    writeCookie(COOKIE_KEY, selected.join(","));
  }, [selected]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const toggle = (key: string) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const filtered = useMemo(
    () => (points ? filterFromEnd(points, range) : []),
    [points, range],
  );
  const selectedDefs = useMemo(
    () => selected.map((k) => SERIES_BY_KEY[k]).filter(Boolean),
    [selected],
  );

  if (isLoading) return <TableSkeleton rows={6} cols={4} />;

  if (error || !points) {
    return (
      <MessageState
        tone="error"
        title="無法載入歷史策略績效"
        description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確；此頁需要 /api/get_performance_history。"
      />
    );
  }

  if (points.length < 2) {
    return (
      <MessageState
        tone="muted"
        title="歷史資料尚未就緒"
        description="待回測曲線與實盤每日權益累積足夠資料後，這裡會顯示可勾選的多指標走勢圖。"
      />
    );
  }

  return (
    <div className={styles.overlayPage}>
      <div className={styles.rangeToolbar}>
        <span className={styles.rangeToolbarLabel}>時間區間</span>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <SeriesToggles selected={selectedSet} onToggle={toggle} />

      <div className={styles.chartCard}>
        {filtered.length < 2 ? (
          <MessageState
            tone="muted"
            title="此區間資料不足"
            description="選定區間內的取樣點少於 2 筆，請改選較長的時間區間。"
          />
        ) : (
          <PerformanceOverlayChart points={filtered} series={selectedDefs} />
        )}
      </div>
    </div>
  );
}

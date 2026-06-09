"use client";

import { useMemo } from "react";
import {
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { PerformanceHistoryPoint } from "@/lib/api/types";
import {
  formatByUnit,
  UNIT_LABELS,
  type SeriesDef,
  type SeriesUnit,
} from "@/lib/performance-series";

import styles from "./performance.module.css";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const AXIS = { grid: "rgba(148, 163, 184, 0.1)", ticks: "#9aa3b2" } as const;

// 金額軸用 compact（124萬）避免長標籤；百分比/倍數軸用後綴。
const TWD_COMPACT = new Intl.NumberFormat("zh-TW", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function tickFor(unit: SeriesUnit, value: number): string {
  if (unit === "twd") return TWD_COMPACT.format(value);
  // 軸刻度由 chart.js 以浮點步進產生，需收斂精度避免 2.6000000000005 之類的尾數。
  const rounded = Number(value.toFixed(2));
  return unit === "mult" ? `${rounded}×` : `${rounded}%`;
}

interface PerformanceOverlayChartProps {
  /** 已依時間區間過濾的資料點（升冪）。 */
  points: readonly PerformanceHistoryPoint[];
  /** 目前勾選要顯示的指標（依勾選順序）。 */
  series: readonly SeriesDef[];
}

/**
 * 多指標疊圖：每個勾選的指標一條線，依單位分配到金額／百分比／倍數三條 Y 軸，
 * 讓不同量綱的指標能在同一張圖上交叉比對。null 值畫成斷點（如 go-live 前的實盤線）。
 */
export function PerformanceOverlayChart({ points, series }: PerformanceOverlayChartProps) {
  const { data, options } = useMemo(() => {
    const labels = points.map((p) => p.date);
    const datasets = series.map((s) => ({
      label: s.label,
      data: points.map((p) => s.accessor(p)),
      borderColor: s.color,
      backgroundColor: s.color,
      borderWidth: 2,
      borderDash: s.dash ? [6, 4] : undefined,
      pointRadius: 0,
      pointHoverRadius: 3,
      tension: 0.15,
      spanGaps: false,
      fill: false,
      yAxisID: s.unit,
    }));

    const used = new Set<SeriesUnit>(series.map((s) => s.unit));
    const unitByIndex = series.map((s) => s.unit);
    // 只讓主軸（依 twd→pct→mult 優先序的第一個在用者）畫水平格線，避免多軸格線打架。
    const primary: SeriesUnit = used.has("twd")
      ? "twd"
      : used.has("pct")
        ? "pct"
        : "mult";

    const yScale = (unit: SeriesUnit, position: "left" | "right") => ({
      type: "linear" as const,
      display: used.has(unit),
      position,
      grid: { color: AXIS.grid, drawOnChartArea: unit === primary },
      border: { display: false },
      title: { display: used.has(unit), text: UNIT_LABELS[unit], color: AXIS.ticks },
      ticks: {
        color: AXIS.ticks,
        maxTicksLimit: 6,
        callback: (value: number | string) => tickFor(unit, Number(value)),
      },
    });

    const chartData: ChartData<"line"> = { labels, datasets };

    const chartOptions: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) =>
              `${ctx.dataset.label}：${formatByUnit(ctx.parsed.y, unitByIndex[ctx.datasetIndex])}`,
          },
        },
      },
      scales: {
        x: {
          type: "category",
          grid: { color: AXIS.grid },
          ticks: {
            color: AXIS.ticks,
            maxTicksLimit: 8,
            autoSkip: true,
            maxRotation: 0,
          },
        },
        twd: yScale("twd", "left"),
        pct: yScale("pct", "right"),
        mult: yScale("mult", "right"),
      },
    };

    return { data: chartData, options: chartOptions };
  }, [points, series]);

  if (series.length === 0) {
    return <p className={styles.overlayEmpty}>請於上方至少勾選一個指標。</p>;
  }

  return (
    <div className={styles.chartBox}>
      <Line data={data} options={options} />
    </div>
  );
}

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

import type { LiveEquityPoint } from "@/lib/api/types";
import { equityChangePct, equityTrend } from "@/lib/equity-chart";
import { formatCurrency, formatPercent } from "@/lib/format";

import styles from "./performance.module.css";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// canvas 無法解析 CSS 變數，故與 tokens.css 對齊的具體色值在此集中定義。
const COLORS = {
  up: "#ef4d52", // 期末高於期初（漲・紅）
  down: "#3fc08a", // 期末低於期初（跌・綠）
  neutral: "#5fb7c6",
  holding: "#39c2d7", // 持股市值
  cash: "#7c89a0", // 預備現金
  grid: "rgba(148, 163, 184, 0.1)",
  ticks: "#9aa3b2",
} as const;

interface LiveEquityChartProps {
  points: readonly LiveEquityPoint[];
}

/**
 * 實盤每日權益歷史折線圖：總權益主線（依區間漲跌上色）＋ 持股市值／預備現金兩條輔助線。
 * 真實帳本走勢——回答「這套策略上線後，我的錢隨時間怎麼變」。
 */
export function LiveEquityChart({ points }: LiveEquityChartProps) {
  const trend = equityTrend(points);
  const changePct = equityChangePct(points);
  const mainColor =
    trend === "profit" ? COLORS.up : trend === "loss" ? COLORS.down : COLORS.neutral;

  const { data, options } = useMemo(() => {
    const fillColor =
      trend === "profit"
        ? "rgba(239, 77, 82, 0.12)"
        : trend === "loss"
          ? "rgba(63, 192, 138, 0.12)"
          : "rgba(95, 183, 198, 0.12)";

    const chartData: ChartData<"line"> = {
      labels: points.map((p) => p.date),
      datasets: [
        {
          label: "總權益",
          data: points.map((p) => p.total_equity),
          borderColor: mainColor,
          backgroundColor: fillColor,
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.18,
          fill: "origin",
          order: 2,
        },
        {
          label: "持股市值",
          data: points.map((p) => p.holding_value),
          borderColor: COLORS.holding,
          borderWidth: 1.4,
          borderDash: [4, 3],
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.18,
          fill: false,
          order: 1,
        },
        {
          label: "預備現金",
          data: points.map((p) => p.cash),
          borderColor: COLORS.cash,
          borderWidth: 1.4,
          borderDash: [4, 3],
          pointRadius: 0,
          pointHoverRadius: 3,
          tension: 0.18,
          fill: false,
          order: 0,
        },
      ],
    };

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
              `${ctx.dataset.label}：${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          type: "category",
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.ticks,
            maxTicksLimit: 8,
            autoSkip: true,
            maxRotation: 0,
          },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: {
            color: COLORS.ticks,
            callback: (value) => formatCurrency(value),
          },
        },
      },
    };

    return { data: chartData, options: chartOptions };
  }, [points, mainColor, trend]);

  const legend = [
    { label: "總權益", color: mainColor },
    { label: "持股市值", color: COLORS.holding },
    { label: "預備現金", color: COLORS.cash },
  ];

  return (
    <div>
      {changePct !== null ? (
        <p className={styles.chartCaption}>
          區間 <strong>{points[0]?.date}</strong> ～{" "}
          <strong>{points[points.length - 1]?.date}</strong>，總權益自{" "}
          {formatCurrency(points[0]?.total_equity)} 至{" "}
          {formatCurrency(points[points.length - 1]?.total_equity)}（
          <span className={`${styles.chartChange} num`} data-trend={trend}>
            {formatPercent(changePct)}
          </span>
          ）。
        </p>
      ) : null}
      <div className={styles.chartBox}>
        <Line data={data} options={options} />
      </div>
      <ul className={styles.chartLegend}>
        {legend.map((item) => (
          <li key={item.label} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

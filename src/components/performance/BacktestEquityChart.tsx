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

import type { EquityPoint } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";

import styles from "./performance.module.css";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// canvas 無法解析 CSS 變數，故與 tokens.css 對齊的具體色值在此集中定義。
const COLORS = {
  strat: "#39c2d7", // 本策略（品牌 teal）
  bh: "#8b97a8", // 買進持有（中性灰）
  grid: "rgba(148, 163, 184, 0.1)",
  ticks: "#9aa3b2",
} as const;

interface BacktestEquityChartProps {
  curve: readonly EquityPoint[];
}

/**
 * 回測權益曲線折線圖：本策略 vs 買進持有的全期每日總權益（等距取樣）。
 * 同本金、同注資下兩條曲線的長期分歧，是策略價值最直觀的證據。
 */
export function BacktestEquityChart({ curve }: BacktestEquityChartProps) {
  const { data, options } = useMemo(() => {
    const chartData: ChartData<"line"> = {
      labels: curve.map((p) => p.date),
      datasets: [
        {
          label: "本策略",
          data: curve.map((p) => p.strat_equity),
          borderColor: COLORS.strat,
          backgroundColor: "rgba(57, 194, 215, 0.1)",
          borderWidth: 2.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.18,
          fill: "origin",
          order: 1,
        },
        {
          label: "買進持有",
          data: curve.map((p) => p.bh_equity),
          borderColor: COLORS.bh,
          borderWidth: 1.6,
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
  }, [curve]);

  const legend = [
    { label: "本策略", color: COLORS.strat },
    { label: "買進持有", color: COLORS.bh },
  ];

  return (
    <div>
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

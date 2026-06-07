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

import {
  calculatePointSize,
  costRange,
  filterByRange,
  type MergedHistoryPoint,
  type TimeRange,
} from "@/lib/chart-data";
import { formatCurrency, formatNumber } from "@/lib/format";

import styles from "./StockChart.module.css";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const COLORS = {
  line: "#4f9cf0",
  buyOpen: "#ec5a44", // 未獲利了結買點（紅）
  buyClosed: "#34c98a", // 已獲利了結買點（綠）
  sell: "#e668d6", // 賣出點（洋紅）
  grid: "rgba(148, 163, 184, 0.12)",
  ticks: "#9aa3b2",
} as const;

const LEGEND = [
  { label: "收盤價", color: COLORS.line },
  { label: "買入點（未獲利了結）", color: COLORS.buyOpen },
  { label: "買入點（已獲利了結）", color: COLORS.buyClosed },
  { label: "賣出點", color: COLORS.sell },
] as const;

interface StockChartProps {
  points: readonly MergedHistoryPoint[];
  range: TimeRange;
  stockId: string;
}

/**
 * 所有 dataset 都「依索引對齊 labels」：折線是價格陣列，
 * 標記點是「該日有交易→價格，否則 null」的陣列 + 對應半徑陣列。
 * 這是 chart.js 在 category 軸上疊加標記最穩定的做法（避免 {x,y} 物件與
 * 數字陣列混用造成的類別錯位）。tooltip 的金額用 dataIndex 從成本陣列查。
 */
export function StockChart({ points, range, stockId }: StockChartProps) {
  const { data, options } = useMemo(() => {
    const filtered = filterByRange(points, range);
    const cr = costRange(filtered);

    const markerSeries = (selector: (p: MergedHistoryPoint) => number) => {
      const value = filtered.map(selector);
      return {
        data: filtered.map((p, i) => (value[i] > 0 ? p.price : null)),
        radius: value.map((v) => (v > 0 ? calculatePointSize(v, cr.min, cr.max) : 0)),
        cost: value,
      };
    };

    const sell = markerSeries((p) => p.realizedRevenue);
    const buyClosed = markerSeries((p) => p.realizedInvestmentCost);
    const buyOpen = markerSeries((p) => p.unrealizedInvestmentCost);

    // datasetIndex → 該標記系列的金額陣列（line 為 0，無金額）。
    const costByDataset: (number[] | null)[] = [null, sell.cost, buyClosed.cost, buyOpen.cost];

    const chartData: ChartData<"line"> = {
      labels: filtered.map((p) => p.date),
      datasets: [
        {
          label: `${stockId} 收盤價`,
          data: filtered.map((p) => p.price),
          borderColor: COLORS.line,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.15,
          fill: false,
          order: 3,
        },
        {
          label: "歷史賣出點",
          data: sell.data,
          showLine: false,
          pointRadius: sell.radius,
          pointHoverRadius: sell.radius.map((r) => r + 2),
          pointBackgroundColor: COLORS.sell,
          pointBorderColor: "rgba(255,255,255,0.45)",
          pointBorderWidth: 1,
          order: 0,
        },
        {
          label: "歷史買入點（已獲利了結）",
          data: buyClosed.data,
          showLine: false,
          pointRadius: buyClosed.radius,
          pointHoverRadius: buyClosed.radius.map((r) => r + 2),
          pointBackgroundColor: COLORS.buyClosed,
          pointBorderColor: "rgba(255,255,255,0.45)",
          pointBorderWidth: 1,
          order: 1,
        },
        {
          label: "歷史買入點（未獲利了結）",
          data: buyOpen.data,
          showLine: false,
          pointRadius: buyOpen.radius,
          pointHoverRadius: buyOpen.radius.map((r) => r + 2),
          pointBackgroundColor: COLORS.buyOpen,
          pointBorderColor: "rgba(255,255,255,0.45)",
          pointBorderWidth: 1,
          order: 2,
        },
      ],
    };

    const chartOptions: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      // 關閉進場動畫：切換時間範圍時資料量會大幅變動，動畫過程的中間狀態
      // 會誤導判讀（看起來像斷崖），且讓 E2E 截圖不穩定。
      animation: false,
      interaction: { mode: "nearest", intersect: true },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"line">) => {
              if (ctx.datasetIndex === 0) {
                return `收盤價：${formatNumber(ctx.parsed.y)}`;
              }
              const cost = costByDataset[ctx.datasetIndex]?.[ctx.dataIndex];
              return `${ctx.dataset.label}：${formatCurrency(cost)}`;
            },
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
          ticks: { color: COLORS.ticks },
        },
      },
    };

    return { data: chartData, options: chartOptions };
  }, [points, range, stockId]);

  return (
    <div>
      <div className={styles.chartBox}>
        <Line data={data} options={options} />
      </div>
      <ul className={styles.legend}>
        {LEGEND.map((item) => (
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

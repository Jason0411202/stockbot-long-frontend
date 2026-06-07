"use client";

import Link from "next/link";

import { Card, DataTable, StateView, type Column } from "@/components/ui";
import { useStockStatistics } from "@/hooks/useStatistics";
import type { StockStatistic } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

import styles from "./StatisticsSection.module.css";

const COLUMNS: ReadonlyArray<Column<StockStatistic>> = [
  {
    key: "stock",
    header: "股票",
    render: (r) => (
      <Link className={styles.stockLink} href={`/stocks/${r.stock_id}`}>
        <span className={styles.stockId}>{r.stock_id}</span>
        <span className={styles.stockName}>{r.stock_name}</span>
      </Link>
    ),
  },
  {
    key: "today",
    header: "今日價格",
    numeric: true,
    render: (r) => formatNumber(r.today_price),
  },
  {
    key: "lower",
    header: "位於近 N 日最低點",
    numeric: true,
    render: (r) => `${formatNumber(r.lower_point_days, 0)} 日`,
  },
  {
    key: "upper",
    header: "位於近 N 日最高點",
    numeric: true,
    render: (r) => `${formatNumber(r.upper_point_days, 0)} 日`,
  },
  {
    key: "action",
    header: "",
    align: "right",
    render: (r) => (
      <Link className={styles.chartLink} href={`/stocks/${r.stock_id}`}>
        歷史圖 →
      </Link>
    ),
  },
];

export function StatisticsSection() {
  const { rows, error, isLoading } = useStockStatistics();

  return (
    <StateView
      isLoading={isLoading}
      error={error}
      data={rows}
      emptyTitle="目前沒有追蹤標的"
      emptyDescription="後端的 config.yaml track_stocks 尚未設定，或統計資料尚未產生。"
    >
      {(data) => (
        <Card flush accent>
          <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.stock_id} />
        </Card>
      )}
    </StateView>
  );
}

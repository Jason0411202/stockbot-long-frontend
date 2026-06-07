"use client";

import Link from "next/link";

import { Card, DataTable, StateView, TrendBadge, type Column } from "@/components/ui";
import { useRealized } from "@/hooks/usePortfolio";
import type { RealizedGainLoss } from "@/lib/api/types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedNumber,
  trendOf,
} from "@/lib/format";
import { computePortfolioSummary } from "@/lib/summary";

import { PortfolioSummary } from "./PortfolioSummary";
import styles from "./table.module.css";

const COLUMNS: ReadonlyArray<Column<RealizedGainLoss>> = [
  { key: "buy_date", header: "買入日期", render: (r) => r.buy_date },
  { key: "sell_date", header: "賣出日期", render: (r) => r.sell_date },
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
  { key: "buy_price", header: "買入價", numeric: true, render: (r) => formatNumber(r.purchase_price) },
  { key: "sell_price", header: "賣出價", numeric: true, render: (r) => formatNumber(r.sell_price) },
  { key: "shares", header: "股數", numeric: true, render: (r) => formatNumber(r.shares, 0) },
  { key: "cost", header: "投資成本", numeric: true, render: (r) => formatCurrency(r.investment_cost) },
  { key: "revenue", header: "賣出收入", numeric: true, render: (r) => formatCurrency(r.revenue) },
  {
    key: "pl",
    header: "損益",
    numeric: true,
    render: (r) => (
      <TrendBadge trend={trendOf(r.profit_loss)}>
        {formatSignedNumber(r.profit_loss)}
      </TrendBadge>
    ),
  },
  {
    key: "rate",
    header: "損益率",
    numeric: true,
    render: (r) => (
      <TrendBadge trend={trendOf(r.profit_rate)}>
        {formatPercent(r.profit_rate)}
      </TrendBadge>
    ),
  },
];

export function RealizedSection() {
  const { rows, error, isLoading } = useRealized();

  return (
    <StateView
      isLoading={isLoading}
      error={error}
      data={rows}
      emptyTitle="目前沒有已實現損益"
      emptyDescription="尚無完成的賣出交易，或後端尚未產生平倉紀錄。"
    >
      {(data) => (
        <>
          <PortfolioSummary
            summary={computePortfolioSummary(data)}
            variant="realized"
          />
          <Card flush accent>
            <DataTable
              columns={COLUMNS}
              rows={data}
              rowKey={(r, i) => `${r.stock_id}-${r.buy_date}-${r.sell_date}-${i}`}
            />
          </Card>
        </>
      )}
    </StateView>
  );
}

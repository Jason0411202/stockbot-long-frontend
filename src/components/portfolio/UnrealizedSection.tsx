"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Card, DataTable, StateView, TrendBadge, type Column } from "@/components/ui";
import { useAmountScale } from "@/contexts/AmountScaleContext";
import { useUnrealized } from "@/hooks/usePortfolio";
import type { UnrealizedGainLoss } from "@/lib/api/types";
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

function createColumns(scale: number): ReadonlyArray<Column<UnrealizedGainLoss>> {
  return [
    { key: "date", header: "交易日期", render: (r) => r.transaction_date },
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
    { key: "price", header: "買入價", numeric: true, render: (r) => formatNumber(r.transaction_price) },
    { key: "shares", header: "股數", numeric: true, render: (r) => formatNumber(r.shares, 0) },
    { key: "cost", header: "投資成本", numeric: true, render: (r) => formatCurrency(r.investment_cost, scale) },
    { key: "now_price", header: "現價", numeric: true, render: (r) => formatNumber(r.todayClosePrice) },
    { key: "now_value", header: "現值", numeric: true, render: (r) => formatCurrency(r.now_value, scale) },
    {
      key: "pl",
      header: "預估損益",
      numeric: true,
      render: (r) => (
        <TrendBadge trend={trendOf(r.predict_profit_loss)}>
          {formatSignedNumber(r.predict_profit_loss, 2, scale)}
        </TrendBadge>
      ),
    },
    {
      key: "rate",
      header: "損益率",
      numeric: true,
      render: (r) => (
        <TrendBadge trend={trendOf(r.predict_profit_rate)}>
          {formatPercent(r.predict_profit_rate)}
        </TrendBadge>
      ),
    },
  ];
}

export function UnrealizedSection() {
  const { scale } = useAmountScale();
  const { rows, error, isLoading } = useUnrealized();
  const columns = useMemo(() => createColumns(scale), [scale]);

  return (
    <StateView
      isLoading={isLoading}
      error={error}
      data={rows}
      emptyTitle="目前沒有未實現持倉"
      emptyDescription="尚無進行中的買入部位，或後端尚未產生交易紀錄。"
    >
      {(data) => (
        <>
          <PortfolioSummary
            summary={computePortfolioSummary(data)}
            variant="unrealized"
          />
          <Card flush accent>
            <DataTable
              columns={columns}
              rows={data}
              rowKey={(r, i) => `${r.stock_id}-${r.transaction_date}-${i}`}
            />
          </Card>
        </>
      )}
    </StateView>
  );
}

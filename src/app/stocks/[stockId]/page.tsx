"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

import { RangeSelector } from "@/components/stocks/RangeSelector";
import { StockChart } from "@/components/stocks/StockChart";
import { Card, PageShell, Spinner, StateView } from "@/components/ui";
import { useStockChart } from "@/hooks/useStockChart";
import type { TimeRange } from "@/lib/chart-data";

export default function StockDetailPage() {
  const params = useParams<{ stockId: string | string[] }>();
  const stockId = Array.isArray(params.stockId) ? params.stockId[0] : params.stockId;
  const [range, setRange] = useState<TimeRange>("1m");

  const { points, error, isLoading } = useStockChart(stockId);

  return (
    <PageShell
      eyebrow="個股歷史走勢"
      title={<span className="num">{stockId ?? ""}</span>}
      description="歷史收盤價，以及系統在各交易日的買入／賣出決策點（點大小反映金額）。"
      actions={<RangeSelector value={range} onChange={setRange} />}
    >
      <StateView
        isLoading={isLoading}
        error={error}
        data={points}
        loading={
          <Card>
            <Spinner label="載入歷史資料…" />
          </Card>
        }
        emptyTitle="查無此股票的歷史資料"
        emptyDescription="請確認此股票代號在後端的追蹤清單（config.yaml track_stocks）中。"
      >
        {(data) => (
          <Card accent>
            <StockChart points={data} range={range} stockId={stockId ?? ""} />
          </Card>
        )}
      </StateView>
    </PageShell>
  );
}

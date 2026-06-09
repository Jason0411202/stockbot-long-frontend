"use client";

import { useMemo, useState } from "react";

import { RangeSelector } from "@/components/stocks/RangeSelector";
import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { useEquityHistory } from "@/hooks/useEquityHistory";
import { usePerformanceSummary } from "@/hooks/usePerformance";
import type { EquityPoint, LiveEquityPoint } from "@/lib/api/types";
import type { TimeRange } from "@/lib/chart-data";
import {
  equityChangePct,
  equityExtent,
  equityTrend,
  filterFromEnd,
} from "@/lib/equity-chart";
import { formatCurrency, formatPercent, type Trend } from "@/lib/format";

import { AssetAllocation } from "./AssetAllocation";
import { BacktestEquityChart } from "./BacktestEquityChart";
import { CapitalBreakdown } from "./CapitalBreakdown";
import { EquityOverview } from "./EquityOverview";
import { LiveEquityChart } from "./LiveEquityChart";
import { RobustnessScorecard } from "./RobustnessScorecard";
import { StrategyVsBenchmark } from "./StrategyVsBenchmark";
import { TradeStats } from "./TradeStats";
import styles from "./performance.module.css";

/**
 * 歷史策略績效：以時間軸折線圖呈現策略隨時間的權益走勢（實盤每日帳本 + 全期回測），
 * 並完整列出與總覽相同的績效指標、穩健性、資金與交易明細。權益走勢可選時間區間。
 */
export function HistoricalPerformance() {
  const { summary, error, isLoading } = usePerformanceSummary();
  const [range, setRange] = useState<TimeRange>("all");

  if (isLoading) return <TableSkeleton rows={5} cols={4} />;

  if (error || !summary) {
    return (
      <MessageState
        tone="error"
        title="無法載入歷史策略績效"
        description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。"
      />
    );
  }

  const { backtest } = summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <section className={styles.section} aria-label="實盤現況">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>實盤現況</h2>
          <span className={styles.sectionMeta}>真實帳本 + BotState</span>
        </div>
        <EquityOverview summary={summary} />
      </section>

      <section className={styles.section} aria-label="資產配置">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>資產配置</h2>
          <span className={styles.sectionMeta}>持股市值 vs 預備現金</span>
        </div>
        <AssetAllocation summary={summary} />
      </section>

      <div className={styles.rangeToolbar}>
        <span className={styles.rangeToolbarLabel}>權益走勢 · 時間區間</span>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <LiveEquitySection range={range} />
      <BacktestEquitySection range={range} curve={backtest?.equity_curve} />

      {backtest ? (
        <>
          <section className={styles.section} aria-label="策略 vs 買進持有">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>策略 vs 買進持有</h2>
              <span className={styles.sectionMeta}>全期回測 · 同本金同注資</span>
            </div>
            <StrategyVsBenchmark backtest={backtest} />
          </section>

          <section className={styles.section} aria-label="穩健性檢驗">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>穩健性檢驗</h2>
              <span className={styles.sectionMeta}>Walk-Forward Scorecard</span>
            </div>
            <RobustnessScorecard score={backtest.walk_forward} />
          </section>

          <section className={styles.section} aria-label="交易統計">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>交易與多視窗統計</h2>
            </div>
            <TradeStats backtest={backtest} />
          </section>
        </>
      ) : null}

      <section className={styles.section} aria-label="資金與帳本">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>資金與帳本</h2>
        </div>
        <CapitalBreakdown summary={summary} />
      </section>
    </div>
  );
}

/** 實盤每日權益走勢（真實帳本），依選定區間過濾並附區間統計。 */
function LiveEquitySection({ range }: { range: TimeRange }) {
  const { points, error, isLoading } = useEquityHistory();
  const filtered = useMemo(
    () => (points ? filterFromEnd(points, range) : []),
    [points, range],
  );

  return (
    <section className={styles.section} aria-label="實盤每日權益走勢">
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>實盤每日權益走勢</h2>
        <span className={styles.sectionMeta}>真實帳本 · 逐日快照</span>
      </div>
      <div className={styles.chartCard}>
        {isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : error ? (
          <MessageState
            tone="error"
            title="無法載入權益歷史"
            description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。"
          />
        ) : !points || points.length < 2 ? (
          <MessageState
            tone="muted"
            title="權益歷史尚未累積"
            description="上線後系統會逐日寫入真實帳戶權益快照，待累積足夠天數即會在此呈現走勢。"
          />
        ) : filtered.length < 2 ? (
          <MessageState
            tone="muted"
            title="此區間資料不足"
            description="選定區間內的權益快照少於 2 筆，請改選較長的時間區間。"
          />
        ) : (
          <>
            <LiveEquityChart points={filtered} />
            <LiveRangeStats points={filtered} />
          </>
        )}
      </div>
    </section>
  );
}

/** 選定區間的權益統計帶：期初／期末／報酬率／最高／最低。 */
function LiveRangeStats({ points }: { points: readonly LiveEquityPoint[] }) {
  const first = points[0]?.total_equity;
  const last = points[points.length - 1]?.total_equity;
  const changePct = equityChangePct(points);
  const trend: Trend = equityTrend(points);
  const extent = equityExtent(points);

  return (
    <dl className={styles.metricGrid}>
      <p className={styles.metricGroupLabel}>區間統計（選定範圍）</p>
      <Metric label="期初權益" value={formatCurrency(first)} />
      <Metric label="期末權益" value={formatCurrency(last)} />
      <Metric label="區間報酬率" value={formatPercent(changePct)} trend={trend} />
      <Metric label="區間最高" value={formatCurrency(extent?.max)} />
      <Metric label="區間最低" value={formatCurrency(extent?.min)} />
    </dl>
  );
}

function Metric({
  label,
  value,
  trend = "neutral",
}: {
  label: string;
  value: string;
  trend?: Trend;
}) {
  return (
    <div className={styles.metric}>
      <dt>{label}</dt>
      <dd data-trend={trend}>{value}</dd>
    </div>
  );
}

/** 全期回測權益曲線（策略 vs 買進持有），依選定區間過濾。 */
function BacktestEquitySection({
  range,
  curve,
}: {
  range: TimeRange;
  curve: readonly EquityPoint[] | undefined;
}) {
  const filtered = useMemo(
    () => (curve ? filterFromEnd(curve, range) : []),
    [curve, range],
  );

  return (
    <section className={styles.section} aria-label="回測權益曲線">
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>回測權益曲線</h2>
        <span className={styles.sectionMeta}>全期回測 · 策略 vs 買進持有</span>
      </div>
      <div className={styles.chartCard}>
        {!curve || curve.length < 2 ? (
          <MessageState
            tone="muted"
            title="回測曲線尚未就緒"
            description="可能是歷史資料量不足，或追蹤標的剛調整；待資料齊備後會顯示策略與買進持有的全期對照。"
          />
        ) : filtered.length < 2 ? (
          <MessageState
            tone="muted"
            title="此區間資料不足"
            description="選定區間內的取樣點少於 2 筆，請改選較長的時間區間。"
          />
        ) : (
          <BacktestEquityChart curve={filtered} />
        )}
      </div>
    </section>
  );
}

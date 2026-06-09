"use client";

import Link from "next/link";

import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { useEquityHistory } from "@/hooks/useEquityHistory";
import { usePerformanceSummary } from "@/hooks/usePerformance";

import { BacktestEquityChart } from "./BacktestEquityChart";
import { LiveEquityChart } from "./LiveEquityChart";
import styles from "./performance.module.css";

/**
 * 歷史策略績效：以時間軸折線圖呈現「策略隨時間的權益走勢」，
 * 上方為實盤真實帳本每日權益，下方為全期回測（策略 vs 買進持有）。
 */
export function HistoricalPerformance() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <LiveEquitySection />
      <BacktestEquitySection />
    </div>
  );
}

/** 實盤每日權益走勢（真實帳本）。 */
function LiveEquitySection() {
  const { points, error, isLoading } = useEquityHistory();

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
        ) : (
          <LiveEquityChart points={points} />
        )}
      </div>
    </section>
  );
}

/** 全期回測權益曲線（策略 vs 買進持有）。 */
function BacktestEquitySection() {
  const { summary, error, isLoading } = usePerformanceSummary();
  const curve = summary?.backtest?.equity_curve;

  return (
    <section className={styles.section} aria-label="回測權益曲線">
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>回測權益曲線</h2>
        <span className={styles.sectionMeta}>全期回測 · 策略 vs 買進持有</span>
      </div>
      <div className={styles.chartCard}>
        {isLoading ? (
          <TableSkeleton rows={4} cols={3} />
        ) : error ? (
          <MessageState
            tone="error"
            title="無法載入回測曲線"
            description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。"
          />
        ) : !curve || curve.length < 2 ? (
          <MessageState
            tone="muted"
            title="回測曲線尚未就緒"
            description="可能是歷史資料量不足，或追蹤標的剛調整；待資料齊備後會顯示策略與買進持有的全期對照。"
          />
        ) : (
          <>
            <BacktestEquityChart curve={curve} />
            {summary?.backtest ? (
              <p className={styles.chartFoot}>
                回測區間 <strong>{summary.backtest.span_start}</strong> ～{" "}
                <strong>{summary.backtest.span_end}</strong>，等距取樣呈現；
                完整指標與穩健性檢驗請見
                <Link className={styles.chartFootLink} href="/">
                  總覽
                </Link>
                。
              </p>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

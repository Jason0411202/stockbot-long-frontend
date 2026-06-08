"use client";

import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { usePerformanceSummary } from "@/hooks/usePerformance";

import { CapitalBreakdown } from "./CapitalBreakdown";
import { EquityOverview } from "./EquityOverview";
import { RobustnessScorecard } from "./RobustnessScorecard";
import { StrategyVsBenchmark } from "./StrategyVsBenchmark";
import { TradeStats } from "./TradeStats";
import styles from "./performance.module.css";

/** /performance 頁的完整績效儀表板：實盤現況 → 回測對照 → 穩健性 → 資金與交易明細。 */
export function PerformanceDashboard() {
  const { summary, error, isLoading } = usePerformanceSummary();

  if (isLoading) return <TableSkeleton rows={4} cols={4} />;

  if (error || !summary) {
    return (
      <MessageState
        tone="error"
        title="無法載入績效摘要"
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

          <section className={styles.section} aria-label="資金與帳本">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>資金與帳本</h2>
            </div>
            <CapitalBreakdown summary={summary} />
          </section>

          <section className={styles.section} aria-label="交易統計">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>交易與多視窗統計</h2>
            </div>
            <TradeStats backtest={backtest} />
          </section>
        </>
      ) : (
        <>
          <section className={styles.section} aria-label="資金與帳本">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>資金與帳本</h2>
            </div>
            <CapitalBreakdown summary={summary} />
          </section>
          <p className={styles.emptyBacktest}>
            回測指標尚未就緒——可能是歷史資料量不足，或追蹤標的剛調整。
            待資料齊備後，此處會顯示策略與買進持有的全期對照與穩健性 scorecard。
          </p>
        </>
      )}
    </div>
  );
}

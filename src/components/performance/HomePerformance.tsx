"use client";

import Link from "next/link";

import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { usePerformanceSummary } from "@/hooks/usePerformance";

import { EquityOverview } from "./EquityOverview";
import { RobustnessScorecard } from "./RobustnessScorecard";
import { StrategyVsBenchmark } from "./StrategyVsBenchmark";
import styles from "./performance.module.css";

/** 首頁的績效摘要：實盤總權益 → 策略 vs 買進持有 → 穩健性總評，並導向完整績效頁。 */
export function HomePerformance() {
  const { summary, error, isLoading } = usePerformanceSummary();

  if (isLoading) return <TableSkeleton rows={3} cols={4} />;

  if (error || !summary) {
    return (
      <MessageState
        tone="error"
        title="無法連線後端"
        description="請確認後端服務已啟動，且 NEXT_PUBLIC_BACKEND_URL 設定正確。"
      />
    );
  }

  const { backtest } = summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <EquityOverview summary={summary} />

      {backtest ? (
        <>
          <section className={styles.section} aria-label="策略 vs 買進持有">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>策略 vs 買進持有</h2>
              <Link href="/performance" className={styles.sectionMeta}>
                完整績效報告 →
              </Link>
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
        </>
      ) : null}
    </div>
  );
}

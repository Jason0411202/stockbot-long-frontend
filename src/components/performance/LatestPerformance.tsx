"use client";

import Link from "next/link";

import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { usePerformanceSummary } from "@/hooks/usePerformance";

import { AssetAllocation } from "./AssetAllocation";
import { CapitalBreakdown } from "./CapitalBreakdown";
import { EquityOverview } from "./EquityOverview";
import { RobustnessScorecard } from "./RobustnessScorecard";
import { StrategyVsBenchmark } from "./StrategyVsBenchmark";
import { TradeStats } from "./TradeStats";
import styles from "./performance.module.css";

/**
 * 總覽頁的「最新策略績效」快照：模擬帳本現況 → 資產配置 → 回測對照 → 穩健性 → 資金與交易明細。
 * 只呈現「當前最新」狀態；隨時間變化的歷史走勢請見「歷史策略績效」。
 */
export function LatestPerformance() {
  const { summary, error, isLoading } = usePerformanceSummary();

  if (isLoading) return <TableSkeleton rows={4} cols={4} />;

  if (error || !summary) {
    return (
      <MessageState
        tone="error"
        title="無法載入策略績效"
        description="資料暫時無法載入，請稍後重新整理。"
      />
    );
  }

  const { backtest } = summary;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>
      <section className={styles.section} aria-label="模擬帳本現況">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>模擬帳本現況</h2>
          <span className={styles.sectionMeta}>每 60 秒更新 · 僅模擬記帳</span>
        </div>
        <EquityOverview summary={summary} />
        <p className={styles.sectionMeta}>
          估值資料：{summary.valuation_date || "依各部位最近資料"} 起
          {summary.valuation_basis === "close" ? " · 收盤價" : " · 含開盤成交暫估，日期依部位而異"}。
          模擬以開盤價記帳，未計手續費、稅與滑價，並無券商成交。
        </p>
      </section>

      <section className={styles.section} aria-label="資產配置">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>資產配置</h2>
          <span className={styles.sectionMeta}>持股市值 vs 預備現金</span>
        </div>
        <AssetAllocation summary={summary} />
      </section>

      {backtest ? (
        <>
          <section className={styles.section} aria-label="策略 vs 買進持有">
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitle}>策略 vs 買進持有</h2>
              <Link href="/performance" className={styles.sectionMeta}>
                歷史走勢 →
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

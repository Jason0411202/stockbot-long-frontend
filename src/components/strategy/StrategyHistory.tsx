"use client";

import { Button } from "@/components/ui/Button";
import { useStrategyMonitorHistory } from "@/hooks/useStrategyMonitor";
import styles from "./strategy.module.css";

interface Props {
  selectedDate: string;
  snapshotDate?: string;
  onSelect: (date: string) => void;
}

export function StrategyHistory({ selectedDate, snapshotDate, onSelect }: Props) {
  const { history, error, isLoading, isValidating, refresh } = useStrategyMonitorHistory();
  const entries = history?.entries ?? [];
  const currentDate = selectedDate || snapshotDate || history?.newest_date || "";
  // The latest snapshot can arrive before the next index poll.
  const older = entries.find((entry) => entry.decision_date < currentDate);
  const newer = entries.findLast((entry) => entry.decision_date > currentDate);
  const latestDate = selectedDate ? history?.newest_date : snapshotDate || history?.newest_date;
  const backfill = history?.backfill;
  const busy = backfill?.status === "pending" || backfill?.status === "running";
  const progress = backfill && backfill.total > 0 ? Math.min(100, Math.max(0, backfill.completed / backfill.total * 100)) : 0;
  const selectedMissing = selectedDate && !entries.some((entry) => entry.decision_date === selectedDate);

  return (
    <section className={styles.history} aria-label="決策歷史">
      <div className={styles.historyHeading}>
        <div><span className={styles.eyebrow}>DECISION HISTORY</span><h2>每一次決策，都留有紀錄</h2></div>
        <span className={styles.historyCount}>{isLoading ? "讀取歷史…" : `${entries.length.toLocaleString("zh-TW")} 次決策`}</span>
      </div>
      <div className={styles.historyControls}>
        <div className={styles.dateField}>
          <label htmlFor="strategy-decision-date">決策日期</label>
          <select id="strategy-decision-date" value={selectedDate} onChange={(event) => onSelect(event.target.value)}>
            <option value="">最新決策{latestDate ? ` · ${latestDate}` : ""}</option>
            {selectedMissing ? <option value={selectedDate}>{selectedDate}</option> : null}
            {entries.map((entry) => <option key={entry.decision_date} value={entry.decision_date}>{entry.decision_date} · {entry.source === "reconstructed" ? "歷史重建" : "原始決策"}{entry.availability === "unavailable" ? " · 資料不足" : ""}</option>)}
          </select>
        </div>
        <div className={styles.historyNavigation}>
          <Button size="sm" disabled={!older} onClick={() => onSelect(older!.decision_date)} aria-label="前一次">← 前一次</Button>
          <Button size="sm" disabled={!newer} onClick={() => onSelect(newer!.decision_date)} aria-label="後一次">後一次 →</Button>
          <Button size="sm" disabled={!selectedDate} onClick={() => onSelect("")}>最新決策</Button>
        </div>
      </div>
      {error ? <div role="alert" className={styles.historyError}><span>歷史清單暫時無法載入，已載入的決策仍可查看。</span><Button size="sm" disabled={isValidating} onClick={() => { void refresh().catch(() => undefined); }}>重試歷史清單</Button></div> : null}
      {backfill ? <div className={styles.backfill} data-status={backfill.status} role="status" aria-label="歷史重建進度" aria-live="polite">
        <div><span className={styles.backfillLabel}>{busy ? "歷史資料自動回補中" : backfill.status === "failed" ? "自動回補暫未完成" : "歷史資料已保存"}</span><span>{busy ? `${backfill.completed.toLocaleString("zh-TW")} / ${backfill.total.toLocaleString("zh-TW")} 次` : history?.oldest_date && history?.newest_date ? `${history.oldest_date} — ${history.newest_date}` : "等待決策紀錄"}</span></div>
        {busy ? <progress aria-label="自動回補進度" value={progress} max={100} /> : null}
        <p>{backfill.message || (busy ? "可先查看已完成的日期，清單會自動更新。" : backfill.status === "failed" ? "暫時無法完成回補，既有紀錄仍保留；後端將自動重試。" : "已有紀錄保持原樣；缺漏日期以當前策略與歷史行情重建。")}</p>
      </div> : null}
    </section>
  );
}

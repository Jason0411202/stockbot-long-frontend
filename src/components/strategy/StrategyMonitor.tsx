"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MessageState, TableSkeleton } from "@/components/ui/feedback";
import { useAmountScale } from "@/contexts/AmountScaleContext";
import { useStrategyMonitor } from "@/hooks/useStrategyMonitor";
import { ApiError } from "@/lib/api/client";
import type { ConditionStatus, DecisionStatus, StrategyCondition, StrategyDecision, StrategyMonitorStock } from "@/lib/api/strategy-types";
import { formatCurrency, formatNumber, formatShares, scaleAmount } from "@/lib/format";
import styles from "./strategy.module.css";
import { StrategyHistory } from "./StrategyHistory";

const DECISION_LABELS: Record<DecisionStatus, string> = {
  executed: "已執行", blocked: "等待條件", eligible: "條件成立", inactive: "不適用", unavailable: "資料不足",
};
const CONDITION_LABELS: Record<ConditionStatus, string> = {
  passed: "已滿足", blocked: "未滿足", inactive: "不適用", unavailable: "資料不足",
};
const OPERATORS: Record<string, string> = { lt: "<", lte: "≤", gt: ">", gte: "≥", eq: "=", "<=": "≤", ">=": "≥" };

function valueText(value: number | null, unit: string, scale = 1): string {
  if (value === null || !Number.isFinite(value)) return "—";
  switch (unit) {
    case "price": return `$${new Intl.NumberFormat("zh-TW", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value)}`;
    case "percent": return `${formatNumber(value)}%`;
    case "days": return `${formatNumber(value, 0)} 天`;
    case "shares": return `${formatShares(value)} 股`;
    case "currency": case "amount": {
      const amount = scaleAmount(value, scale);
      return amount === null ? "—" : new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(amount);
    }
    case "ratio": case "multiple": return `${formatNumber(value)}×`;
    case "boolean": return value === 1 ? "是" : "否";
    case "regime": return value === 1 ? "多頭" : "空頭";
    default: return formatNumber(value);
  }
}

function timeText(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

function Status({ status, condition = false }: { status: DecisionStatus | ConditionStatus; condition?: boolean }) {
  const label = condition ? CONDITION_LABELS[status as ConditionStatus] : DECISION_LABELS[status as DecisionStatus];
  return <span className={styles.status} data-status={status}><span aria-hidden="true">{status === "passed" || status === "executed" ? "✓" : status === "blocked" ? "○" : "·"}</span>{label ?? "未知狀態"}</span>;
}

/** A numeric axis with a threshold marker, never a probability or combined score. */
function ThresholdChart({ condition }: { condition: StrategyCondition }) {
  const { value, threshold, unit, status } = condition;
  if (value === null || threshold === null || !Number.isFinite(value) || !Number.isFinite(threshold) || unit === "boolean" || unit === "regime" || status === "unavailable") return null;
  const low = Math.min(0, value, threshold);
  const high = Math.max(0, value, threshold);
  const padding = (high - low || 1) * 0.12;
  const axisMin = low < 0 ? low - padding : 0;
  const axisMax = high + padding;
  const position = (number: number) => Math.max(0, Math.min(100, (number - axisMin) / (axisMax - axisMin) * 100));
  const currentPosition = position(value);
  const targetPosition = position(threshold);
  return (
    <div className={styles.chart} aria-hidden="true" data-status={status}>
      <div className={styles.track}>
        <span className={styles.fill} style={{ left: `${Math.min(position(0), currentPosition)}%`, width: `${Math.abs(currentPosition - position(0))}%` }} />
        <span className={styles.threshold} style={{ left: `${targetPosition}%` }} />
        <span className={styles.current} style={{ left: `${currentPosition}%` }} />
      </div>
      <div className={styles.chartLegend}><span><i />當次值</span><span><i />門檻線</span></div>
    </div>
  );
}

function Condition({ condition }: { condition: StrategyCondition }) {
  const { scale } = useAmountScale();
  const isCooldown = condition.remaining_days !== undefined;
  const numeric = condition.value !== null && condition.threshold !== null && condition.unit !== "boolean";
  return (
    <li className={styles.condition}>
      <div className={styles.conditionHeading}><h4>{condition.label}</h4><Status status={condition.status} condition /></div>
      {isCooldown ? (
        <div className={styles.reading}>
          <strong className="num">{condition.remaining_days! > 0 ? `剩餘 ${condition.remaining_days} 天` : "冷卻已解除"}</strong>
          <span>決策當時 · 日曆日</span>
        </div>
      ) : condition.unit === "regime" ? (
        <div className={styles.reading}><strong>{valueText(condition.value, "regime")}</strong><span>生效市況：{valueText(condition.threshold, "regime")}</span></div>
      ) : numeric ? (
        <div className={styles.reading}><strong className="num">{valueText(condition.value, condition.unit, scale)}</strong><span>門檻 <b className="num">{OPERATORS[condition.operator] ?? condition.operator} {valueText(condition.threshold, condition.unit, scale)}</b></span></div>
      ) : null}
      <ThresholdChart condition={condition} />
      {isCooldown && numeric ? <p className={styles.conditionNote}>已經過 {valueText(condition.value, "days")}／需滿 {valueText(condition.threshold, "days")}{condition.release_date ? ` · 解除日 ${condition.release_date}` : ""}</p> : null}
      <p className={styles.conditionNote}>{condition.description}</p>
    </li>
  );
}

function DecisionSection({ side, decision, stockId, reconstructed }: { side: "buy" | "sell"; decision: StrategyDecision; stockId: string; reconstructed: boolean }) {
  const { scale } = useAmountScale();
  const buy = side === "buy";
  const id = `${stockId}-${side}`;
  return (
    <section className={styles.decision} data-side={side} aria-labelledby={id}>
      <div className={styles.decisionHead}>
        <div className={styles.decisionTitle}><span className={styles.direction} aria-hidden="true">{buy ? "↙" : "↗"}</span><div><span className={styles.eyebrow}>{buy ? "ENTRY" : "EXIT"}</span><h3 id={id}>{buy ? "買入策略" : "賣出策略"}</h3></div></div>
        <Status status={decision.status} />
      </div>
      <div className={styles.verdict} data-status={decision.status}>
        <strong>{decision.status === "executed" ? `已${buy ? "買入" : "賣出"} ${formatShares(decision.executed_shares)} 股` : buy ? "逢低分批買入" : "空頭移動停利"}</strong>
        {decision.reasons.length ? <ul>{decision.reasons.map((reason, i) => <li key={`${i}-${reason}`}>{reason}</li>)}</ul> : <p>{decision.status === "executed" ? "本次決策已於模擬帳本完成。" : "各項必要條件需同時滿足。"}</p>}
      </div>
      <ul className={styles.conditions}>{decision.conditions.map((condition) => <Condition key={condition.id} condition={condition} />)}</ul>
      <details className={styles.details}>
        <summary>計算細節與{buy ? "買入" : "賣出"}結果<span aria-hidden="true">＋</span></summary>
        <div className={styles.detailContent}>
          <dl className={styles.metrics}>
            {decision.metrics.map((metric) => <div key={metric.id}><dt>{metric.label}</dt><dd className="num">{valueText(metric.value, metric.unit, scale)}</dd><p>{metric.description}</p></div>)}
          </dl>
          <dl className={styles.outcome}>
            <div><dt>目標／執行股數</dt><dd className="num">{formatShares(decision.intended_shares)}／{formatShares(decision.executed_shares)} 股</dd></div>
            <div><dt>此階段持股變化</dt><dd className="num">{formatShares(decision.held_shares_before)} → {formatShares(decision.held_shares_after)} 股</dd></div>
            <div><dt>此階段現金變化</dt><dd className="num">{formatCurrency(decision.cash_before, scale)} → {formatCurrency(decision.cash_after, scale)}</dd></div>
          </dl>
          <p className={styles.conditionNote}>{reconstructed ? "依重建時的策略計算條件，成交與持股依歷史帳本還原。" : "按機器人實際處理順序記錄；同日買入會先於賣出評估。"}{scale !== 1 ? `帳本金額與現金門檻套用 ${formatNumber(scale)}× 顯示倍率；股價、股數、百分比與天數維持原值。` : ""}</p>
        </div>
      </details>
    </section>
  );
}

function StockPanel({ stock, date, basis, reconstructed }: { stock: StrategyMonitorStock; date: string; basis: string; reconstructed: boolean }) {
  return (
    <article className={styles.stock} aria-label={`${stock.stock_id} 策略監控`}>
      <header className={styles.stockHead}>
        <div className={styles.stockIdentity}>
          <span className={styles.stockMark} aria-hidden="true">{stock.stock_id.slice(-2)}</span>
          <div><div className={styles.stockTitle}><h2 className="num">{stock.stock_id}</h2><span className={styles.regime} data-regime={stock.regime}>{stock.regime === "bull" ? "多頭" : stock.regime === "bear" ? "空頭" : "市況待確認"}</span></div><Link href={`/stocks/${stock.stock_id}`} className={styles.stockLink}>查看價格走勢 ↗</Link></div>
        </div>
        <div className={styles.quote}><span>{date} · {basis === "open" ? "開盤" : "收盤"}決策價</span><strong className="num">{valueText(stock.decision_price, "price")}</strong></div>
      </header>
      <div className={styles.stockMeta}><span>指標截至 <b className="num">{stock.indicator_date || "—"}</b></span><span>決策前持股 <b className="num">{formatShares(stock.buy.held_shares_before)} 股</b></span><span>決策後持股 <b className="num">{formatShares(stock.sell.held_shares_after)} 股</b></span>{stock.regime_method === "ma_pos" ? <span>前收 <b className="num">{valueText(stock.regime_value, "price")}</b>／{stock.regime_window} 日均線 <b className="num">{valueText(stock.regime_base, "price")}</b>{stock.regime_base === null ? "（資料不足，沿用策略空頭判定）" : ""}</span> : null}</div>
      <div className={styles.decisions}><DecisionSection side="buy" decision={stock.buy} stockId={stock.stock_id} reconstructed={reconstructed} /><DecisionSection side="sell" decision={stock.sell} stockId={stock.stock_id} reconstructed={reconstructed} /></div>
    </article>
  );
}

export function StrategyMonitor() {
  const [selectedDate, setSelectedDate] = useState("");
  const { snapshot, error, isLoading, isValidating, refresh } = useStrategyMonitor(selectedDate);
  const [selectedStock, setSelectedStock] = useState("all");
  const reload = () => { void refresh().catch(() => undefined); };
  const history = <StrategyHistory selectedDate={selectedDate} snapshotDate={snapshot?.decision_date} onSelect={setSelectedDate} />;
  const wrap = (content: React.ReactNode) => <div className={styles.monitor}>{history}{content}</div>;
  if (isLoading && !snapshot) return wrap(<div role="status" aria-label="載入策略快照"><TableSkeleton rows={8} cols={2} /><p className={styles.loading}>正在取得{selectedDate || "最新"}決策…</p></div>);
  if (!snapshot) return wrap(<MessageState tone="error" title="無法載入策略監控" description={error instanceof ApiError && error.status === 404 ? selectedDate ? `${selectedDate} 尚無可讀取的決策紀錄，請選擇其他日期或稍後重試。` : "目前後端尚未提供策略監控，請更新後端服務後再試。" : `目前無法取得${selectedDate || "最新"}決策，請稍後重新載入或選擇其他日期。`} action={<Button onClick={reload} disabled={isValidating}>重新載入</Button>} />);
  if (snapshot.schema_version !== 1) return wrap(<MessageState tone="error" title="策略資料版本不相容" description="請更新前端後再查看此快照。" action={<Button onClick={reload}>重新載入</Button>} />);
  if (selectedDate && snapshot.decision_date !== selectedDate) return wrap(<MessageState tone="error" title="決策日期不符" description="後端回傳的紀錄與選取日期不一致，請稍後重試。" action={<Button onClick={reload}>重新載入</Button>} />);
  const stocks = snapshot.stocks ?? [];
  const reconstructed = snapshot.source === "reconstructed";
  const selection = stocks.some((stock) => stock.stock_id === selectedStock) ? selectedStock : "all";
  const visibleStocks = selection === "all" ? stocks : stocks.filter((stock) => stock.stock_id === selection);
  return (
    <div className={styles.monitor}>
      {history}
      <div className={styles.toolbar}><span className={styles.liveLabel} data-source={snapshot.source}><i />{reconstructed ? "歷史重建" : "原始決策快照"}<span>· 唯讀</span></span>{snapshot.strategy_version ? <span className={styles.version} title={snapshot.strategy_version}>策略版本 {snapshot.strategy_version}</span> : null}</div>
      {error ? <div role="alert" className={styles.warning}>更新失敗，以下保留上次取得的快照。請檢查決策日期後，再試一次。</div> : null}
      {reconstructed || snapshot.warnings?.length ? <aside className={styles.provenance} aria-label="紀錄來源說明"><strong>{reconstructed ? "以當前策略與歷史行情重建" : "紀錄說明"}</strong>{reconstructed ? <p>此日期未保存完整的原始快照。圖表呈現回補時的策略規則；成交結果依歷史帳本還原，可能與重建條件不同。此紀錄保存後不再隨策略改動。</p> : null}{snapshot.warnings?.length ? <details><summary>查看重建依據與資料限制</summary><ul>{snapshot.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details> : null}</aside> : null}
      {snapshot.availability !== "available" || stocks.length === 0 ? <MessageState title={snapshot.decision_date ? `${snapshot.decision_date} · 決策資料不足` : "等待決策歷史"} description={snapshot.message || "後端正在整理歷史紀錄，完成後會自動顯示；新決策也會持續保存。"} /> : <>
        <section className={styles.overview} aria-label="決策摘要">
          <div className={styles.snapshotDate}><span className={styles.eyebrow}>{selectedDate ? "歷史決策" : "最新決策"}</span><strong className="num">{snapshot.decision_date}</strong><span>模擬帳本 · {reconstructed ? "歷史重建" : snapshot.execution_mode === "catchup" ? "歷史補算" : "每日決策"}</span></div>
          <div className={styles.summaryMetric}><span>追蹤標的</span><strong className="num">{stocks.length.toString().padStart(2, "0")}<small>檔</small></strong></div>
          <div className={styles.summaryMetric} data-side="buy"><span>本次已買入</span><strong className="num">{stocks.filter((s) => s.buy.status === "executed").length.toString().padStart(2, "0")}<small>檔</small></strong></div>
          <div className={styles.summaryMetric} data-side="sell"><span>本次已賣出</span><strong className="num">{stocks.filter((s) => s.sell.status === "executed").length.toString().padStart(2, "0")}<small>檔</small></strong></div>
        </section>
        <div className={styles.context}><p>{snapshot.indicator_rule || "條件與冷卻以決策當時為準。"} 冷卻剩餘天數固定於此快照；解除日後仍需等待下一次交易日決策。</p><span>快照記錄 {timeText(snapshot.recorded_at)}（台北）</span></div>
        <div className={styles.filterBar}><div role="group" aria-label="股票篩選" className={styles.filters}><Button size="sm" active={selection === "all"} aria-pressed={selection === "all"} onClick={() => setSelectedStock("all")}>全部股票</Button>{stocks.map((stock) => <Button key={stock.stock_id} size="sm" active={selection === stock.stock_id} aria-pressed={selection === stock.stock_id} onClick={() => setSelectedStock(stock.stock_id)}>{stock.stock_id}</Button>)}</div><span>買入與賣出條件逐項檢視</span></div>
        {visibleStocks.map((stock) => <StockPanel key={`${snapshot.decision_date}-${stock.stock_id}`} stock={stock} date={snapshot.decision_date} basis={snapshot.decision_price_basis} reconstructed={reconstructed} />)}
        <p className={styles.footnote}>門檻線表示策略設定；色點表示該次決策使用的數值。各條件需依策略同時成立，圖表長度不代表交易機率。</p>
      </>}
    </div>
  );
}

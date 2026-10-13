import type { StrategyMonitor, StrategyMonitorHistory } from "../src/lib/api/strategy-types";
import type { PerformanceSummary } from "../src/lib/api/types";

/** A decision snapshot, not a forecast: the cooldown is frozen at decision time. */
export const strategyMonitorFixture: StrategyMonitor = {
  schema_version: 1,
  availability: "available",
  message: "",
  decision_date: "2026-10-13",
  recorded_at: "2026-10-13T09:00:00+08:00",
  decision_price_basis: "open",
  execution_mode: "live",
  source: "original",
  strategy_version: "test-strategy-original-v1",
  warnings: [],
  indicator_rule: "僅使用決策日前已完成的收盤資料",
  stocks: [
    {
      stock_id: "00631L",
      status: "evaluated",
      decision_price: 116.4,
      indicator_date: "2026-10-12",
      regime: "bull",
      regime_method: "ma_pos",
      regime_window: 60,
      regime_value: 118,
      regime_base: 110,
      buy: {
        status: "blocked",
        reasons: ["買入冷卻尚未結束"],
        conditions: [
          {
            id: "entry_price",
            label: "進場價格",
            status: "passed",
            value: 116.4,
            threshold: 118.8,
            operator: "lt",
            unit: "price",
            description: "決策價須嚴格低於 10 日均線 110 元乘上多頭帶寬 1.08；仍需通過冷卻條件。",
          },
          {
            id: "buy_cooldown",
            label: "買入間隔",
            status: "blocked",
            value: 12,
            threshold: 14,
            operator: "gte",
            unit: "days",
            description: "距離上次買入 12 個日曆日，冷卻門檻為 14 個日曆日。",
            remaining_days: 2,
            release_date: "2026-10-15",
          },
          { id: "reentry_cooldown", label: "賣出後再進場冷卻", status: "passed", value: null, threshold: 42, operator: "gte", unit: "days", remaining_days: 0, description: "尚無前次交易紀錄，無需等待。" },
          { id: "order_size", label: "買入預算", status: "passed", value: 43, threshold: 1, operator: "gte", unit: "shares", description: "策略預算換算股數後須達最小可成交數量。" },
          { id: "available_cash", label: "可用現金", status: "passed", value: 25000, threshold: 116.4, operator: "gte", unit: "currency", description: "買入金額會受可用現金限制，不借款。" },
        ],
        metrics: [
          { id: "entry_ma", label: "進場均線", value: 110, unit: "price", description: "10 日收盤均線，只使用決策時可見的資料。" },
          { id: "buy_band", label: "進場帶寬", value: 8, unit: "percent", description: "多頭依設定放寬；空頭為零。" },
          { id: "budget_basis", label: "預算基礎", value: 25000, unit: "currency", description: "買入評估前現金。" },
          { id: "depth_multiplier", label: "加碼倍率", value: 1, unit: "ratio", description: "多頭為一倍。" },
        ],
        intended_shares: 0,
        executed_shares: 0,
        cash_before: 25000,
        cash_after: 25000,
        held_shares_before: 1000,
        held_shares_after: 1000,
      },
      sell: {
        status: "blocked",
        reasons: ["多頭市況持股續抱；移動停利回落尚未達門檻"],
        conditions: [
          { id: "held_position", label: "持有部位", status: "passed", value: 1000, threshold: 0, operator: "gt", unit: "shares", description: "需要有尚未賣出的持股。" },
          {
            id: "bear_regime",
            label: "空頭市況",
            status: "blocked",
            value: 1,
            threshold: 0,
            operator: "eq",
            unit: "regime",
            description: "只有空頭啟用移動停利；多頭持股續抱。",
          },
          { id: "trail_enabled", label: "移動停利設定", status: "passed", value: 8, threshold: 0, operator: "gt", unit: "percent", description: "回落門檻須大於零才啟用。" },
          { id: "peak_gain", label: "獲利保護啟動", status: "passed", value: 20, threshold: 10, operator: "gte", unit: "percent", description: "持倉峰值相對最低持倉成本的獲利須先達門檻。" },
          {
            id: "trailing_drawdown",
            label: "峰值回落",
            status: "blocked",
            value: 3,
            threshold: 8,
            operator: "gte",
            unit: "percent",
            description: "相對持有期間峰值，回落至少 8% 才符合此條件。",
          },
        ],
        metrics: [
          { id: "peak", label: "持有期間峰值", value: 120, unit: "price", description: "此批持股的追蹤峰值。" },
        ],
        intended_shares: 0,
        executed_shares: 0,
        cash_before: 25000,
        cash_after: 25000,
        held_shares_before: 1000,
        held_shares_after: 1000,
      },
    },
    {
      stock_id: "00830",
      status: "evaluated",
      decision_price: 92,
      indicator_date: "2026-10-12",
      regime: "bear",
      regime_method: "ma_pos",
      regime_window: 85,
      regime_value: 94,
      regime_base: 96,
      buy: {
        status: "blocked",
        reasons: ["決策價等於進場門檻，未符合嚴格小於條件"],
        conditions: [
          {
            id: "entry_price",
            label: "進場價格",
            status: "blocked",
            value: 92,
            threshold: 92,
            operator: "lt",
            unit: "price",
            description: "空頭進場須嚴格低於 10 日均線，等於門檻時不買入。",
          },
        ],
        metrics: [],
        intended_shares: 0,
        executed_shares: 0,
        cash_before: 25000,
        cash_after: 25000,
        held_shares_before: 100,
        held_shares_after: 100,
      },
      sell: {
        status: "executed",
        reasons: ["移動停利條件成立，已完成模擬賣出"],
        conditions: [
          {
            id: "trailing_drawdown",
            label: "峰值回落",
            status: "passed",
            value: 8,
            threshold: 8,
            operator: "gte",
            unit: "percent",
            description: "回落剛好等於 8% 門檻，條件成立。",
          },
        ],
        metrics: [
          { id: "peak", label: "持有期間峰值", value: 100, unit: "price", description: "此批持股的追蹤峰值。" },
        ],
        intended_shares: 100,
        executed_shares: 100,
        cash_before: 25000,
        cash_after: 34200,
        held_shares_before: 100,
        held_shares_after: 0,
      },
    },
  ],
};

export function makeStrategyMonitor(): StrategyMonitor {
  return structuredClone(strategyMonitorFixture);
}

export const reconstructedWarning = "此快照使用目前策略設定與歷史價格重建，並非當日保存的原始決策。";

export function makeReconstructedMonitor(): StrategyMonitor {
  const snapshot = makeStrategyMonitor();
  snapshot.decision_date = "2026-10-12";
  snapshot.recorded_at = "2026-10-13T10:30:00+08:00";
  snapshot.source = "reconstructed";
  snapshot.execution_mode = "catchup";
  snapshot.strategy_version = "test-strategy-reconstructed-v2";
  snapshot.warnings = [reconstructedWarning];
  for (const stock of snapshot.stocks) stock.indicator_date = "2026-10-08";
  const stock = snapshot.stocks[0];
  stock.decision_price = 104.4;
  stock.regime = "bear";
  stock.regime_value = 106;
  const entry = stock.buy.conditions.find((condition) => condition.id === "entry_price")!;
  entry.value = 104.4;
  entry.threshold = 110;
  entry.description = "空頭決策價須嚴格低於 10 日均線 110 元，仍需通過冷卻條件。";
  stock.buy.conditions.find((condition) => condition.id === "order_size")!.value = 5;
  stock.buy.conditions.find((condition) => condition.id === "available_cash")!.threshold = 104.4;
  stock.buy.metrics.find((metric) => metric.id === "buy_band")!.value = 0;
  const cooldown = stock.buy.conditions.find((condition) => condition.id === "buy_cooldown")!;
  cooldown.value = 9;
  cooldown.remaining_days = 5;
  cooldown.release_date = "2026-10-17";
  cooldown.description = "距離上次買入 9 個日曆日，冷卻門檻為 14 個日曆日。";
  stock.sell.status = "executed";
  stock.sell.reasons = ["歷史重建：空頭移動停利成立，已模擬賣出 1,000 股"];
  stock.sell.intended_shares = 1000;
  stock.sell.executed_shares = 1000;
  stock.sell.held_shares_after = 0;
  stock.sell.cash_after = 129400;
  const regime = stock.sell.conditions.find((condition) => condition.id === "bear_regime")!;
  regime.value = 0;
  regime.status = "passed";
  const drawdown = stock.sell.conditions.find((condition) => condition.id === "trailing_drawdown")!;
  drawdown.value = 13;
  drawdown.status = "passed";
  return snapshot;
}

export function makeUnavailableHistoryMonitor(): StrategyMonitor {
  return {
    ...structuredClone(unavailableStrategyMonitorFixture),
    decision_date: "2026-10-08",
    recorded_at: "2026-10-13T10:30:00+08:00",
    execution_mode: "catchup",
    source: "reconstructed",
    strategy_version: "test-strategy-reconstructed-v2",
    warnings: [reconstructedWarning],
    message: "2026-10-08 的價格資料不足，無法重建決策；其他日期仍可查看。",
  };
}

export function makeInitialRevisionMonitor(date = "2026-10-12"): StrategyMonitor {
  const snapshot = date === "2026-10-08" ? makeUnavailableHistoryMonitor() : makeReconstructedMonitor();
  snapshot.revision = "initial";
  if (date === "2026-10-08") snapshot.message = "當日現金與帳本無法對齊，無法可靠還原決策。";
  return snapshot;
}

export function makeCorrectedHistoryMonitor(date = "2026-10-12"): StrategyMonitor {
  const snapshot = makeReconstructedMonitor();
  snapshot.decision_date = date;
  snapshot.recorded_at = "2026-10-14T10:30:00+08:00";
  snapshot.revision = "ledger-cashflow-v2";
  snapshot.supersedes_revision = "initial";
  snapshot.reconstruction_base_version = snapshot.strategy_version;
  snapshot.strategy_version = "test-strategy-ledger-cashflow-v2";
  snapshot.message = "此修正版使用帳本原始成本與收入還原現金，保留初版供查閱。";
  snapshot.warnings = [reconstructedWarning];
  for (const stock of snapshot.stocks) {
    stock.indicator_date = date === "2026-10-08" ? "2026-10-07" : "2026-10-08";
    for (const decision of [stock.buy, stock.sell]) {
      decision.cash_before -= 1.13;
      decision.cash_after -= 1.13;
    }
    const cash = stock.buy.conditions.find((condition) => condition.id === "available_cash");
    if (cash?.value !== null && cash?.value !== undefined) cash.value -= 1.13;
    const budget = stock.buy.metrics.find((metric) => metric.id === "budget_basis");
    if (budget?.value !== null && budget?.value !== undefined) budget.value -= 1.13;
  }
  return snapshot;
}

export function makeStrategyMonitorHistory(
  snapshots: StrategyMonitor[] = [makeStrategyMonitor(), makeReconstructedMonitor(), makeUnavailableHistoryMonitor()],
): StrategyMonitorHistory {
  const entries = snapshots.filter((snapshot) => snapshot.decision_date).map((snapshot) => ({
    decision_date: snapshot.decision_date,
    source: snapshot.source ?? "original",
    execution_mode: snapshot.execution_mode,
    recorded_at: snapshot.recorded_at,
    strategy_version: snapshot.strategy_version ?? "",
    availability: snapshot.availability,
    ...(snapshot.revision ? { revision: snapshot.revision } : {}),
    ...(snapshot.supersedes_revision === "initial" ? { has_initial_revision: true } : {}),
  })).sort((a, b) => b.decision_date.localeCompare(a.decision_date));
  return {
    entries,
    oldest_date: entries.at(-1)?.decision_date ?? "",
    newest_date: entries[0]?.decision_date ?? "",
    backfill: { status: "complete", completed: entries.length, total: entries.length, message: "歷史重建完成。" },
  };
}

export const unavailableStrategyMonitorFixture: StrategyMonitor = {
  schema_version: 1,
  availability: "unavailable",
  message: "尚未保存實際交易決策快照；下一次交易決策完成後即可查看。",
  decision_date: "",
  recorded_at: "",
  decision_price_basis: "open",
  execution_mode: "live",
  indicator_rule: "",
  stocks: [],
};

/** The amount settings dialog loads this existing endpoint. */
export const performanceSummaryFixture: PerformanceSummary = {
  initial_cash: 100000,
  monthly_contribution: 0,
  total_contributed: 0,
  total_invested: 100000,
  current_cash: 25000,
  holding_value: 116400,
  total_equity: 141400,
  holding_ratio: 82.32,
  cash_ratio: 17.68,
  realized_pnl: 0,
  unrealized_pnl: 41400,
  total_pnl: 41400,
  total_return_rate: 41.4,
  backtest: null,
};

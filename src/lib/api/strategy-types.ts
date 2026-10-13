/** Actual committed decision snapshots. Percentages use 8 = 8%, never 0.08. */
export interface StrategyMonitor {
  schema_version: number;
  availability: "available" | "unavailable";
  message: string;
  decision_date: string;
  recorded_at: string;
  decision_price_basis: "open" | "close";
  execution_mode: "live" | "catchup";
  indicator_rule: string;
  stocks: StrategyMonitorStock[];
}

export interface StrategyMonitorStock {
  stock_id: string;
  status: "evaluated" | "inactive" | "unavailable";
  decision_price: number | null;
  indicator_date: string;
  regime: "bull" | "bear" | "unavailable";
  regime_method: string;
  regime_window: number;
  regime_value: number | null;
  regime_base: number | null;
  buy: StrategyDecision;
  sell: StrategyDecision;
}

export type DecisionStatus = "executed" | "blocked" | "eligible" | "inactive" | "unavailable";
export type ConditionStatus = "passed" | "blocked" | "inactive" | "unavailable";

export interface StrategyDecision {
  status: DecisionStatus;
  reasons: string[];
  conditions: StrategyCondition[];
  metrics: StrategyMetric[];
  intended_shares: number;
  executed_shares: number;
  cash_before: number;
  cash_after: number;
  held_shares_before: number;
  held_shares_after: number;
}

export interface StrategyCondition {
  id: string;
  label: string;
  status: ConditionStatus;
  value: number | null;
  threshold: number | null;
  operator: string;
  unit: string;
  description: string;
  remaining_days?: number;
  release_date?: string;
}

export interface StrategyMetric {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  description: string;
}

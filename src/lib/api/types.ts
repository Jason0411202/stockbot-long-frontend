/**
 * 前端 API 型別，鏡射後端 DTO（請與後端保持同步）：
 *   - internal/dto/portfolio.go    → UnrealizedGainLoss / RealizedGainLoss
 *   - internal/dto/market.go       → StockStatistic / StockHistoryPoint
 *   - internal/dto/performance.go  → PerformanceSummary（含回測 scorecard）
 *
 * 後端以 snake_case 輸出 JSON，唯一例外是 `todayClosePrice`（camelCase，須保持原樣）。
 * 回測比率欄位以 JSONFloat 承載：邊界情況（NaN/±Inf、樣本不足）會序列化為 null，
 * 故對應 TS 型別為 `number | null`。
 */

/** GET /api/get_unrealized_gains_losses 的單筆回應。 */
export interface UnrealizedGainLoss {
  /** 交易日期 (YYYY-MM-DD) */
  transaction_date: string;
  stock_id: string;
  stock_name: string;
  /** 買入成交價 */
  transaction_price: number;
  /** 買入總成本 (= 成交價 × 股數) */
  investment_cost: number;
  /** 持有股數 */
  shares: number;
  /** 即時收盤價；查詢失敗時為 0（唯一 camelCase 欄位） */
  todayClosePrice: number;
  /** 持股現值 (= 今收 × 股數) */
  now_value: number;
  /** 未實現損益 (= 現值 - 成本) */
  predict_profit_loss: number;
  /** 未實現損益率 (%) */
  predict_profit_rate: number;
}

/** GET /api/get_realized_gains_losses 的單筆回應。 */
export interface RealizedGainLoss {
  buy_date: string;
  sell_date: string;
  stock_id: string;
  stock_name: string;
  purchase_price: number;
  sell_price: number;
  investment_cost: number;
  /** 賣出總收入 */
  revenue: number;
  /** 已實現損益 (= 收入 - 成本) */
  profit_loss: number;
  /** 已實現損益率 (%) */
  profit_rate: number;
  /** 賣出股數 */
  shares: number;
}

/** GET /api/get_stock_statistic_data 的單筆回應。 */
export interface StockStatistic {
  stock_id: string;
  stock_name: string;
  /** 今日收盤價 */
  today_price: number;
  /** 距上一個低點的交易日數 (computed) */
  lower_point_days: number;
  /** 距上一個高點的交易日數 (computed) */
  upper_point_days: number;
}

/** GET /api/get_stock_history_data 的單筆回應（收盤價序列，供畫圖）。 */
export interface StockHistoryPoint {
  /** 交易日期 (YYYY-MM-DD) */
  date: string;
  /** 該日收盤價 */
  price: number;
}

/**
 * GET /api/get_performance_summary 的回應：一次回傳「本金明細 + 實盤現況 + 回測指標」。
 * 本金（investing principal）指從外部注入股市的資金（期初一次性 + 每月定額），不含滾出的獲利。
 */
export interface PerformanceSummary {
  // ── 本金明細（外部注入，非滾出的獲利） ──
  /** 期初一次性投入本金 */
  initial_cash: number;
  /** 每月定額注資設定（0 = 關閉） */
  monthly_contribution: number;
  /** 累計已注資（不含期初） */
  total_contributed: number;
  /** 投入本金合計 = 期初 + 累計注資 */
  total_invested: number;

  // ── 實盤現況（真實帳本 + BotState） ──
  /** 目前閒置現金 */
  current_cash: number;
  /** 目前持股市值（即時收盤價估） */
  holding_value: number;
  /** 總權益 = 現金 + 持股市值 */
  total_equity: number;
  /** 累計已實現損益 */
  realized_pnl: number;
  /** 目前未實現損益 */
  unrealized_pnl: number;
  /** 總損益 = 總權益 − 投入本金 */
  total_pnl: number;
  /** 總報酬率 (%) = 總損益 / 投入本金 */
  total_return_rate: number;

  // ── 回測績效（資料不足或評估失敗時為 null） ──
  backtest: BacktestPerformance | null;
}

/** 以 config 期初本金 + 每月注資跑歷史回測（策略 vs 買進持有）的績效輸出。 */
export interface BacktestPerformance {
  /** 回測起點 (YYYY-MM-DD；所有追蹤股票都已發行的最早日) */
  span_start: string;
  /** 回測終點 (YYYY-MM-DD) */
  span_end: string;
  /** 回測年數 (Actual/365) */
  years: number;
  /** 回測投入本金合計（期初 + 期間注資） */
  total_in: number;

  /** 本策略全期績效 */
  strategy: ArmMetrics;
  /** Buy & Hold 對照組（資金一解鎖就買滿） */
  buy_hold: ArmMetrics;

  /** 買入次數 */
  buys: number;
  /** 賣出次數 */
  sells: number;
  /** 移動停利賣出次數 */
  trail_sells: number;
  /** 獲利了結賣出次數 */
  profit_sells: number;
  /** 現金不足被夾取跳過的買入次數 */
  skipped: number;
  /** 策略期末閒置現金（現金尾巴） */
  final_cash: number;

  /** 多視窗 walk-forward 穩健性 scorecard */
  walk_forward: WalkForwardScore;
}

/** 一條權益曲線（策略 / B&H）在全期回測下的核心績效指標。比率欄位邊界可能為 null。 */
export interface ArmMetrics {
  /** 期末總權益 */
  final_equity: number;
  /** 本金倍數 = 期末權益 / 投入本金 */
  multiple: number | null;
  /** 資金加權年化報酬 (XIRR) */
  mwr: number | null;
  /** NAV 單位淨值最大回撤 (<=0，扣除注資灌水) */
  max_drawdown: number | null;
  /** Calmar = MWR / |MaxDrawdown| */
  calmar: number | null;
  /** 年化 Sortino（用 NAV 日報酬） */
  sortino: number | null;
  /** 平均持股佔比（資金利用率） */
  avg_exposure: number | null;
}

/** 多視窗 walk-forward 評估的中位數指標與五道關卡（回答「這策略是否穩健」）。 */
export interface WalkForwardScore {
  /** 每個視窗長度（月） */
  window_months: number;
  /** 視窗步進（月） */
  step_months: number;
  /** 視窗總數 */
  n_windows: number;

  /** 中位 策略 MWR */
  med_strat_mwr: number | null;
  /** 中位 B&H MWR */
  med_bh_mwr: number | null;
  /** 中位 策略 MaxDD */
  med_strat_max_drawdown: number | null;
  /** 中位 B&H MaxDD */
  med_bh_max_drawdown: number | null;
  /** 中位 策略 Calmar（僅取有限值） */
  med_strat_calmar: number | null;
  /** 中位 B&H Calmar（僅取有限值） */
  med_bh_calmar: number | null;
  /** 策略 Calmar 勝 B&H 的視窗比例 */
  calmar_win_rate: number | null;
  /** 策略雙贏同曝險 Blend 的視窗比例（真擇時） */
  blend_skill_rate: number | null;
  /** 中位 報酬參與率（策略 MWR / B&H MWR） */
  ret_participation: number | null;

  /** G1：守住 B&H 七成報酬 */
  g1_return_participation: boolean;
  /** G2：回撤 <=60% B&H */
  g2_risk_reduction: boolean;
  /** G3：Calmar 勝率 >=70% */
  g3_calmar_vs_bh: boolean;
  /** G4：真擇時 >=50%（vs Blend） */
  g4_skill: boolean;
  /** G5：最差視窗回撤不輸 B&H */
  g5_robustness: boolean;
  /** G1~G4 全過（G5 為資訊性） */
  overall_pass: boolean;
}

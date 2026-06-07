/**
 * 前端 API 型別，鏡射後端 DTO（請與後端保持同步）：
 *   - internal/dto/portfolio.go  → UnrealizedGainLoss / RealizedGainLoss
 *   - internal/dto/market.go     → StockStatistic / StockHistoryPoint
 *
 * 後端以 snake_case 輸出 JSON，唯一例外是 `todayClosePrice`（camelCase，須保持原樣）。
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

/**
 * 投資組合彙總計算（移植自舊 helper.js 的 getSummary）。
 *
 * 同時支援未實現（用 predict_profit_loss）與已實現（用 profit_loss）兩種列；
 * 並修正舊版除零會產生 NaN/Infinity 的問題。
 */

import type { RealizedGainLoss, UnrealizedGainLoss } from "./api/types";
import { toFiniteNumber } from "./format";

export interface PortfolioSummary {
  /** 總投資成本 */
  totalCost: number;
  /** 總損益（未實現或已實現） */
  totalProfitLoss: number;
  /** 總損益率 (%)；總成本為 0 時為 0 */
  returnRate: number;
}

type PortfolioRow = UnrealizedGainLoss | RealizedGainLoss;

function profitLossOf(row: PortfolioRow): number {
  // 未實現列有 predict_profit_loss；已實現列有 profit_loss。
  if ("predict_profit_loss" in row) {
    return toFiniteNumber(row.predict_profit_loss) ?? 0;
  }
  return toFiniteNumber(row.profit_loss) ?? 0;
}

export function computePortfolioSummary(rows: readonly PortfolioRow[]): PortfolioSummary {
  let totalCost = 0;
  let totalProfitLoss = 0;

  for (const row of rows) {
    totalCost += toFiniteNumber(row.investment_cost) ?? 0;
    totalProfitLoss += profitLossOf(row);
  }

  const returnRate = totalCost === 0 ? 0 : (totalProfitLoss / totalCost) * 100;

  return { totalCost, totalProfitLoss, returnRate };
}

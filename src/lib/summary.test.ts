import { describe, expect, it } from "vitest";

import type { RealizedGainLoss, UnrealizedGainLoss } from "./api/types";
import { computePortfolioSummary } from "./summary";

function ugl(cost: number, pl: number): UnrealizedGainLoss {
  return {
    transaction_date: "2025-01-01",
    stock_id: "00631L",
    stock_name: "元大台灣50正2",
    transaction_price: 0,
    investment_cost: cost,
    shares: 0,
    todayClosePrice: 0,
    now_value: 0,
    predict_profit_loss: pl,
    predict_profit_rate: 0,
  };
}

function rgl(cost: number, pl: number): RealizedGainLoss {
  return {
    buy_date: "2025-01-01",
    sell_date: "2025-02-01",
    stock_id: "00830",
    stock_name: "國泰費城半導體",
    purchase_price: 0,
    sell_price: 0,
    investment_cost: cost,
    revenue: 0,
    profit_loss: pl,
    profit_rate: 0,
    shares: 0,
  };
}

describe("computePortfolioSummary", () => {
  it("空陣列回傳全 0，不會除零產生 NaN", () => {
    expect(computePortfolioSummary([])).toEqual({
      totalCost: 0,
      totalProfitLoss: 0,
      returnRate: 0,
    });
  });

  it("未實現列以 predict_profit_loss 加總，並計算報酬率", () => {
    const summary = computePortfolioSummary([ugl(1000, 100), ugl(3000, -300)]);
    expect(summary.totalCost).toBe(4000);
    expect(summary.totalProfitLoss).toBe(-200);
    expect(summary.returnRate).toBeCloseTo((-200 / 4000) * 100, 6);
  });

  it("已實現列以 profit_loss 加總", () => {
    const summary = computePortfolioSummary([rgl(2000, 500), rgl(2000, 500)]);
    expect(summary.totalCost).toBe(4000);
    expect(summary.totalProfitLoss).toBe(1000);
    expect(summary.returnRate).toBeCloseTo(25, 6);
  });

  it("總成本為 0 時報酬率為 0（非 Infinity/NaN）", () => {
    const summary = computePortfolioSummary([ugl(0, 50)]);
    expect(summary.totalCost).toBe(0);
    expect(summary.totalProfitLoss).toBe(50);
    expect(summary.returnRate).toBe(0);
  });
});

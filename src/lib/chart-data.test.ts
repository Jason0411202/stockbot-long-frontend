import { describe, expect, it } from "vitest";

import type {
  RealizedGainLoss,
  StockHistoryPoint,
  UnrealizedGainLoss,
} from "./api/types";
import {
  calculatePointSize,
  costRange,
  filterByRange,
  mergeHistoryWithTrades,
  type MergedHistoryPoint,
} from "./chart-data";

function hp(date: string, price: number): StockHistoryPoint {
  return { date, price };
}

function ugl(
  stockId: string,
  date: string,
  cost: number,
): UnrealizedGainLoss {
  return {
    transaction_date: date,
    stock_id: stockId,
    stock_name: stockId,
    transaction_price: 0,
    investment_cost: cost,
    shares: 0,
    todayClosePrice: 0,
    now_value: 0,
    predict_profit_loss: 0,
    predict_profit_rate: 0,
  };
}

function rgl(
  stockId: string,
  buyDate: string,
  sellDate: string,
  cost: number,
  revenue: number,
): RealizedGainLoss {
  return {
    buy_date: buyDate,
    sell_date: sellDate,
    stock_id: stockId,
    stock_name: stockId,
    purchase_price: 0,
    sell_price: 0,
    investment_cost: cost,
    revenue,
    profit_loss: 0,
    profit_rate: 0,
    shares: 0,
  };
}

function mp(
  date: string,
  price: number,
  u: number,
  r: number,
  rev: number,
): MergedHistoryPoint {
  return {
    date,
    price,
    unrealizedInvestmentCost: u,
    realizedInvestmentCost: r,
    realizedRevenue: rev,
  };
}

describe("mergeHistoryWithTrades", () => {
  const history = [hp("2025-01-01", 10), hp("2025-01-02", 11), hp("2025-01-03", 12)];

  it("依股號過濾，並把買/賣資訊併入對應日期；同日賣出收入加總", () => {
    const merged = mergeHistoryWithTrades(
      history,
      [ugl("00631L", "2025-01-01", 500), ugl("OTHER", "2025-01-02", 999)],
      [
        rgl("00631L", "2025-01-02", "2025-01-03", 300, 50),
        rgl("00631L", "2025-01-01", "2025-01-03", 200, 70),
      ],
      "00631L",
    );

    expect(merged[0]).toEqual(mp("2025-01-01", 10, 500, 200, 0));
    expect(merged[1]).toEqual(mp("2025-01-02", 11, 0, 300, 0)); // OTHER 被濾掉
    expect(merged[2]).toEqual(mp("2025-01-03", 12, 0, 0, 120)); // 50 + 70
  });

  it("沒有任何交易時，三個成本欄位皆為 0", () => {
    const merged = mergeHistoryWithTrades(history, [], [], "00631L");
    expect(merged.map((p) => p.unrealizedInvestmentCost)).toEqual([0, 0, 0]);
    expect(merged.map((p) => p.realizedRevenue)).toEqual([0, 0, 0]);
  });
});

describe("filterByRange", () => {
  const now = new Date("2025-06-15T00:00:00");
  const points = [
    mp("2025-06-10", 1, 0, 0, 0),
    mp("2025-05-01", 1, 0, 0, 0),
    mp("2025-03-01", 1, 0, 0, 0),
    mp("2024-06-01", 1, 0, 0, 0),
    mp("2022-01-01", 1, 0, 0, 0),
  ];

  it("'all' 不過濾", () => {
    expect(filterByRange(points, "all", now)).toHaveLength(5);
  });

  it("'1m' 只留近一個月", () => {
    const result = filterByRange(points, "1m", now);
    expect(result.map((p) => p.date)).toEqual(["2025-06-10"]);
  });

  it("'1y' 只留近一年", () => {
    const result = filterByRange(points, "1y", now);
    expect(result.map((p) => p.date)).toEqual([
      "2025-06-10",
      "2025-05-01",
      "2025-03-01",
    ]);
  });

  it("不會變動傳入的 now", () => {
    const snapshot = now.getTime();
    filterByRange(points, "3m", now);
    expect(now.getTime()).toBe(snapshot);
  });
});

describe("costRange", () => {
  it("min 只看 >= 1 的值，max 看全部", () => {
    const points = [mp("d1", 1, 0.5, 200, 0), mp("d2", 1, 10, 0, 120)];
    expect(costRange(points)).toEqual({ min: 10, max: 200 });
  });

  it("全為 0 時退回 { min: 0, max: 0 }", () => {
    expect(costRange([mp("d1", 1, 0, 0, 0)])).toEqual({ min: 0, max: 0 });
  });
});

describe("calculatePointSize", () => {
  it("範圍退化（max === min）回傳 base + span/2", () => {
    expect(calculatePointSize(5, 10, 10)).toBe(5 + 7 / 2);
  });

  it("線性插值：min→base、max→base+span、中點→中間值", () => {
    expect(calculatePointSize(10, 10, 210)).toBe(5); // base
    expect(calculatePointSize(210, 10, 210)).toBe(12); // base + span
    expect(calculatePointSize(110, 10, 210)).toBe(8.5); // 中點
  });
});

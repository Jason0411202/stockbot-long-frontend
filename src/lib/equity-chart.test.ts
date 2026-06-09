import { describe, expect, it } from "vitest";

import {
  equityChangePct,
  equityExtent,
  equityTrend,
  filterFromEnd,
} from "./equity-chart";

function pt(total_equity: number) {
  return { total_equity };
}

describe("equityTrend", () => {
  it("期末高於期初 → profit（漲）", () => {
    expect(equityTrend([pt(100), pt(120), pt(150)])).toBe("profit");
  });
  it("期末低於期初 → loss（跌）", () => {
    expect(equityTrend([pt(150), pt(110), pt(90)])).toBe("loss");
  });
  it("持平 → neutral", () => {
    expect(equityTrend([pt(100), pt(120), pt(100)])).toBe("neutral");
  });
  it("樣本不足 → neutral", () => {
    expect(equityTrend([])).toBe("neutral");
    expect(equityTrend([pt(100)])).toBe("neutral");
  });
  it("非有限值 → neutral", () => {
    expect(equityTrend([pt(NaN), pt(120)])).toBe("neutral");
  });
});

describe("equityChangePct", () => {
  it("計算期末相對期初的百分比變化", () => {
    expect(equityChangePct([pt(100), pt(125)])).toBe(25);
    expect(equityChangePct([pt(200), pt(150)])).toBe(-25);
  });
  it("樣本不足回傳 null", () => {
    expect(equityChangePct([pt(100)])).toBeNull();
  });
  it("期初為 0 回傳 null（避免除以零）", () => {
    expect(equityChangePct([pt(0), pt(100)])).toBeNull();
  });
});

describe("equityExtent", () => {
  it("取出最高與最低 total_equity", () => {
    expect(equityExtent([pt(120), pt(90), pt(150), pt(110)])).toEqual({
      min: 90,
      max: 150,
    });
  });
  it("略過非有限值", () => {
    expect(equityExtent([pt(NaN), pt(100), pt(Infinity), pt(80)])).toEqual({
      min: 80,
      max: 100,
    });
  });
  it("空序列回傳 null", () => {
    expect(equityExtent([])).toBeNull();
  });
});

describe("filterFromEnd", () => {
  const series = [
    { date: "2020-01-01", total_equity: 100 },
    { date: "2022-06-01", total_equity: 130 },
    { date: "2025-03-01", total_equity: 180 },
    { date: "2025-06-01", total_equity: 200 }, // 末筆
  ];

  it("'all' 原樣回傳", () => {
    expect(filterFromEnd(series, "all")).toHaveLength(4);
  });

  it("相對末筆日期過濾，而非系統當下（過去的終點也能取到區間）", () => {
    // 末筆 2025-06-01，6m → 取 >= 2024-12-01，只剩最後兩點
    const r = filterFromEnd(series, "6m");
    expect(r.map((p) => p.date)).toEqual(["2025-03-01", "2025-06-01"]);
  });

  it("3y 以末筆為基準回推", () => {
    // 末筆 2025-06-01，3y → 取 >= 2022-06-01
    const r = filterFromEnd(series, "3y");
    expect(r.map((p) => p.date)).toEqual([
      "2022-06-01",
      "2025-03-01",
      "2025-06-01",
    ]);
  });

  it("空序列回傳空陣列", () => {
    expect(filterFromEnd([], "1y")).toEqual([]);
  });
});

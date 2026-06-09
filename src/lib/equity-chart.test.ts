import { describe, expect, it } from "vitest";

import { equityChangePct, equityTrend } from "./equity-chart";

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

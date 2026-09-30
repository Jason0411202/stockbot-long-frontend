import { describe, expect, it } from "vitest";

import {
  calculateAmountScale,
  formatScale,
  normalizeAmountScale,
  parseCapitalInput,
  roundAmountScale,
} from "./amount-scale";

describe("normalizeAmountScale", () => {
  it("接受正有限數字", () => {
    expect(normalizeAmountScale("2.5")).toBe(2.5);
  });

  it.each([null, "", "x", 0, -1, Number.POSITIVE_INFINITY])(
    "拒絕無效倍率 %s",
    (value) => {
      expect(normalizeAmountScale(value)).toBeNull();
    },
  );
});

describe("parseCapitalInput", () => {
  it("接受半形與全形千分位逗號", () => {
    expect(parseCapitalInput(" 1,250，000 ")).toBe(1_250_000);
  });
});

describe("roundAmountScale", () => {
  it("保留足夠精度供 cookie 儲存", () => {
    expect(roundAmountScale(1 / 3)).toBe(0.333333333333);
  });
});

describe("calculateAmountScale", () => {
  it("以使用者總資金除以模擬帳本總權益", () => {
    expect(calculateAmountScale(2_500_000, 1_000_000)).toBe(2.5);
  });

  it("拒絕無效或非正數的權益", () => {
    expect(calculateAmountScale(2_500_000, 0)).toBeNull();
    expect(calculateAmountScale("x", 1_000_000)).toBeNull();
  });
});

describe("formatScale", () => {
  it("以易讀形式顯示倍率", () => {
    expect(formatScale(1.25)).toBe("1.25");
  });

  it("小倍率不會被顯示成 0", () => {
    expect(formatScale(0.000000001)).toBe("0.000000001");
  });
});

import { describe, expect, it } from "vitest";

import {
  DEFAULT_SELECTED,
  formatByUnit,
  sanitizeSelection,
  SERIES,
  SERIES_BY_KEY,
} from "./performance-series";

describe("SERIES catalog", () => {
  it("每個 key 唯一", () => {
    const keys = SERIES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("SERIES_BY_KEY 對得上每一筆", () => {
    for (const s of SERIES) {
      expect(SERIES_BY_KEY[s.key]).toBe(s);
    }
  });

  it("預設勾選都是合法 key", () => {
    for (const key of DEFAULT_SELECTED) {
      expect(SERIES_BY_KEY[key]).toBeDefined();
    }
  });
});

describe("formatByUnit", () => {
  it("金額用貨幣、倍數加 ×、百分比加 %", () => {
    expect(formatByUnit(1234567, "twd")).toContain("1,234,567");
    expect(formatByUnit(1.405, "mult")).toBe("1.41×");
    expect(formatByUnit(24.35, "pct")).toBe("24.35%");
    expect(formatByUnit(-18.4, "pct")).toBe("-18.40%");
  });

  it("null/undefined 回傳破折號（go-live 前的實盤值）", () => {
    expect(formatByUnit(null, "twd")).toBe("—");
    expect(formatByUnit(undefined, "pct")).toBe("—");
  });
});

describe("sanitizeSelection", () => {
  it("濾掉未知 key、保序去重", () => {
    expect(
      sanitizeSelection(["total_equity", "bogus", "total_equity", "invested"]),
    ).toEqual(["total_equity", "invested"]);
  });

  it("全部非法時回傳空陣列", () => {
    expect(sanitizeSelection(["nope", ""])).toEqual([]);
  });
});

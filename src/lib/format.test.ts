import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatSignedNumber,
  toFiniteNumber,
  trendOf,
} from "./format";

describe("toFiniteNumber", () => {
  it("解析數字與數字字串", () => {
    expect(toFiniteNumber(12.5)).toBe(12.5);
    expect(toFiniteNumber("12.5")).toBe(12.5);
  });

  it("非數字回傳 null", () => {
    expect(toFiniteNumber("Backend Unreachable")).toBeNull();
    expect(toFiniteNumber(Infinity)).toBeNull();
    expect(toFiniteNumber(undefined)).toBeNull();
  });
});

describe("formatCurrency", () => {
  it("含千分位", () => {
    expect(formatCurrency(1234567)).toContain("1,234,567");
  });
  it("非數字回傳破折號", () => {
    expect(formatCurrency("x")).toBe("—");
  });
});

describe("formatNumber", () => {
  it("預設兩位小數", () => {
    expect(formatNumber(12.3)).toBe("12.30");
  });
  it("可指定 0 位小數", () => {
    expect(formatNumber(1000, 0)).toBe("1,000");
  });
  it("非數字回傳破折號", () => {
    expect(formatNumber(null)).toBe("—");
  });
});

describe("formatPercent", () => {
  it("正數加上 + 號", () => {
    expect(formatPercent(12.34)).toBe("+12.34%");
  });
  it("負數保留負號", () => {
    expect(formatPercent(-5)).toBe("-5.00%");
  });
  it("零不加號", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });
});

describe("formatSignedNumber", () => {
  it("正數加號、負數負號", () => {
    expect(formatSignedNumber(1234.5)).toBe("+1,234.50");
    expect(formatSignedNumber(-567)).toBe("-567.00");
  });
});

describe("trendOf", () => {
  it("正→profit、負→loss、零與非數字→neutral", () => {
    expect(trendOf(1)).toBe("profit");
    expect(trendOf(-1)).toBe("loss");
    expect(trendOf(0)).toBe("neutral");
    expect(trendOf("nope")).toBe("neutral");
  });
});

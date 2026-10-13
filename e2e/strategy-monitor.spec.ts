import { expect, test, type Page } from "@playwright/test";

import type { StrategyMonitor } from "../src/lib/api/strategy-types";
import {
  makeStrategyMonitor,
  performanceSummaryFixture,
  unavailableStrategyMonitorFixture,
} from "./strategy-fixture";

const monitorEndpoint = "**/api/get_strategy_monitor";

async function mockMonitor(page: Page, snapshot: StrategyMonitor = makeStrategyMonitor()) {
  await page.route(monitorEndpoint, (route) => route.fulfill({ json: snapshot }));
}

function stockArticle(page: Page, stockId = "00631L") {
  return page.getByRole("article", { name: `${stockId} 策略監控`, exact: true });
}

test("策略監控：導覽、決策快照、買賣門檻及冷卻資訊", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mockMonitor(page);
  await page.goto("/strategy_monitor");

  await expect(page.getByRole("navigation", { name: "主導覽" }).getByRole("link", { name: "策略監控" }))
    .toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 1, name: "策略監控" })).toBeVisible();
  const firstStock = stockArticle(page);
  await expect(firstStock).toBeVisible();
  await expect(firstStock.getByRole("heading", { name: "買入策略", exact: true })).toBeVisible();
  await expect(firstStock.getByRole("heading", { name: "賣出策略", exact: true })).toBeVisible();
  await expect(firstStock).toContainText("116.40");
  await expect(firstStock).toContainText(/3(?:\.0+)?%/);
  await expect(firstStock).toContainText(/8(?:\.0+)?%/);
  await expect(firstStock).toContainText("剩餘 2 天");
  await expect(firstStock).toContainText("2026-10-15");
  await expect(firstStock).toContainText("買入冷卻尚未結束");
  await expect(firstStock.getByText("3.00%", { exact: true })).toBeVisible();
  await expect(firstStock.getByText("≥ 8.00%", { exact: true })).toBeVisible();
  await expect(firstStock).toContainText("多頭市況持股續抱");
  await expect(stockArticle(page, "00830")).toContainText("已完成模擬賣出");
  await page.screenshot({ path: testInfo.outputPath("strategy-desktop.png") });
  await page.screenshot({ path: testInfo.outputPath("strategy-desktop-full.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("股票篩選保留個股買賣兩個區塊，全部可恢復", async ({ page }) => {
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  const filters = page.getByRole("group", { name: "股票篩選" });
  await filters.getByRole("button", { name: "00830", exact: true }).click();
  await expect(stockArticle(page, "00830")).toBeVisible();
  await expect(stockArticle(page)).toHaveCount(0);
  await expect(stockArticle(page, "00830").getByRole("heading", { name: "買入策略", exact: true })).toBeVisible();
  await expect(stockArticle(page, "00830").getByRole("heading", { name: "賣出策略", exact: true })).toBeVisible();
  await filters.getByRole("button", { name: "全部股票", exact: true }).click();
  await expect(stockArticle(page)).toBeVisible();
  await expect(stockArticle(page, "00830")).toBeVisible();
});

test("嚴格小於的進場門檻：價格剛好相等時仍顯示阻擋", async ({ page }) => {
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  const buy = stockArticle(page, "00830").getByRole("region", { name: "買入策略", exact: true });
  await expect(buy).toContainText("決策價等於進場門檻，未符合嚴格小於條件");
  await expect(buy.getByText("< $92.00", { exact: true })).toBeVisible();
  await expect(buy.getByText("未滿足")).toBeVisible();
  await expect(buy.getByText("等待條件")).toBeVisible();
});

test("現金門檻保留小數，116.20 不會看似達到 116.40", async ({ page }) => {
  const snapshot = makeStrategyMonitor();
  const stock = snapshot.stocks[0];
  snapshot.stocks = [stock];
  stock.buy.reasons = ["可用現金不足以買入 1 股，策略預算也未達最小股數"];
  const cash = stock.buy.conditions.find((condition) => condition.id === "available_cash")!;
  cash.value = 116.2;
  cash.threshold = 116.4;
  cash.status = "blocked";
  const orderSize = stock.buy.conditions.find((condition) => condition.id === "order_size")!;
  orderSize.value = 0;
  orderSize.status = "blocked";
  stock.buy.metrics.find((metric) => metric.id === "budget_basis")!.value = 116.2;
  for (const decision of [stock.buy, stock.sell]) {
    decision.cash_before = 116.2;
    decision.cash_after = 116.2;
  }
  await mockMonitor(page, snapshot);
  await page.goto("/strategy_monitor");
  const cashGate = stockArticle(page).getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "可用現金", exact: true }),
  });
  await expect(cashGate.getByText("$116.20", { exact: true })).toBeVisible();
  await expect(cashGate.getByText("≥ $116.40", { exact: true })).toBeVisible();
  await expect(cashGate.getByText("未滿足")).toBeVisible();
});

test("沒有保存過決策時顯示 unavailable 原因，不補成未觸發", async ({ page }) => {
  await mockMonitor(page, unavailableStrategyMonitorFixture);
  await page.goto("/strategy_monitor");
  await expect(page.getByText(unavailableStrategyMonitorFixture.message, { exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: /策略監控$/ })).toHaveCount(0);
});

test("個股缺少資料保留 unavailable，不把 null 價格當成零", async ({ page }) => {
  const snapshot = makeStrategyMonitor();
  const stock = snapshot.stocks[0];
  snapshot.stocks = [stock];
  stock.status = "unavailable";
  stock.decision_price = null;
  stock.regime = "unavailable";
  stock.regime_value = null;
  stock.regime_base = null;
  for (const decision of [stock.buy, stock.sell]) {
    decision.status = "unavailable";
    decision.reasons = ["缺少當日開盤資料，未進行決策"];
    decision.conditions = [];
    decision.metrics = [];
  }
  await mockMonitor(page, snapshot);
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("缺少當日開盤資料，未進行決策");
  await expect(stockArticle(page)).toContainText("—");
  await expect(stockArticle(page)).not.toContainText("116.40");
  await expect(stockArticle(page)).not.toContainText("NaN");
});

test("HTTP 錯誤可以重新載入並取得快照", async ({ page }) => {
  let requests = 0;
  await page.route(monitorEndpoint, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ status: 503, json: { error: "temporary unavailable" } })
      : route.fulfill({ json: makeStrategyMonitor() });
  });
  await page.goto("/strategy_monitor");
  await page.getByRole("button", { name: "重新載入", exact: true }).click();
  await expect(stockArticle(page)).toBeVisible();
  expect(requests).toBeGreaterThanOrEqual(2);
});

test("手動更新讀取下一份快照並保留後端決策數值", async ({ page }) => {
  let requests = 0;
  await page.route(monitorEndpoint, (route) => {
    const snapshot = makeStrategyMonitor();
    requests += 1;
    if (requests > 1) {
      snapshot.stocks[0].decision_price = 117.25;
    }
    return route.fulfill({ json: snapshot });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  await page.getByRole("button", { name: "更新快照", exact: true }).click();
  await expect(stockArticle(page)).toContainText("117.25");
});

test("背景更新失敗保留最後快照並提示資料未更新", async ({ page }) => {
  let requests = 0;
  await page.route(monitorEndpoint, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ json: makeStrategyMonitor() })
      : route.fulfill({ status: 503, json: { error: "temporary unavailable" } });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  await page.getByRole("button", { name: "更新快照", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "更新失敗" })).toBeVisible();
  await expect(stockArticle(page)).toBeVisible();
  await expect(stockArticle(page)).toContainText("116.40");
  await expect(stockArticle(page)).toContainText("剩餘 2 天");
});

test("手機版策略監控沒有水平溢位", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "主導覽" }).getByRole("link", { name: "策略監控", exact: true })).toBeInViewport();
  await expect(stockArticle(page).getByRole("heading", { name: "買入策略", exact: true })).toBeVisible();
  await expect(stockArticle(page).getByRole("heading", { name: "賣出策略", exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("strategy-mobile.png") });
  await page.screenshot({ path: testInfo.outputPath("strategy-mobile-full.png"), fullPage: true });
});

test("切換既有金額倍率不會改變股價、百分比與冷卻天數", async ({ page }) => {
  await mockMonitor(page);
  await page.route("**/api/get_performance_summary", (route) => route.fulfill({ json: performanceSummaryFixture }));
  await page.goto("/strategy_monitor");
  const firstStock = stockArticle(page);
  await expect(firstStock).toContainText("116.40");
  await page.getByRole("button", { name: /金額.*1×/ }).click();
  const settings = page.getByRole("dialog", { name: "金額縮放倍率" });
  await settings.getByLabel("手動設定倍率", { exact: true }).fill("10");
  await settings.getByRole("button", { name: "套用", exact: true }).click();
  await expect(settings.getByRole("status")).toContainText("已套用 10×");
  await settings.getByRole("button", { name: "關閉設定" }).click();
  await expect(firstStock).toContainText("116.40");
  await expect(firstStock).toContainText(/3(?:\.0+)?%/);
  await expect(firstStock).toContainText(/8(?:\.0+)?%/);
  await expect(firstStock).toContainText("剩餘 2 天");
  await expect(firstStock.locator("header").getByText("$116.40", { exact: true })).toBeVisible();
  const entryGate = firstStock.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "進場價格", exact: true }),
  });
  await expect(entryGate.getByText("$116.40", { exact: true })).toBeVisible();
  await expect(entryGate.getByText("< $118.80", { exact: true })).toBeVisible();
  const cashGate = firstStock.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "可用現金", exact: true }),
  });
  await expect(cashGate.getByText("$250,000.00", { exact: true })).toBeVisible();
  const drawdownGate = firstStock.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "峰值回落", exact: true }),
  });
  await expect(drawdownGate.getByText("3.00%", { exact: true })).toBeVisible();
  await expect(drawdownGate.getByText("≥ 8.00%", { exact: true })).toBeVisible();
});

import { expect, test, type Page } from "@playwright/test";

import type { StrategyMonitor, StrategyMonitorHistory } from "../src/lib/api/strategy-types";
import {
  makeReconstructedMonitor,
  makeStrategyMonitor,
  makeStrategyMonitorHistory,
  makeUnavailableHistoryMonitor,
  performanceSummaryFixture,
  reconstructedWarning,
  unavailableStrategyMonitorFixture,
} from "./strategy-fixture";

const monitorEndpoint = /\/api\/get_strategy_monitor(?:\?[^#]*)?$/;
const historyEndpoint = "**/api/get_strategy_monitor_history";

async function mockHistory(page: Page, history: StrategyMonitorHistory = makeStrategyMonitorHistory()) {
  await page.route(historyEndpoint, (route) => route.fulfill({ json: history }));
}

async function mockMonitor(
  page: Page,
  snapshot: StrategyMonitor = makeStrategyMonitor(),
  history?: StrategyMonitorHistory,
) {
  const snapshots = [snapshot, makeReconstructedMonitor(), makeUnavailableHistoryMonitor()];
  await mockHistory(page, history ?? makeStrategyMonitorHistory(snapshot.decision_date ? snapshots : []));
  await page.route(monitorEndpoint, (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    const result = date ? snapshots.find((saved) => saved.decision_date === date) : snapshot;
    return result
      ? route.fulfill({ json: result })
      : route.fulfill({ status: 404, json: { error: "No saved decision for this date" } });
  });
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
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("");
  await expect(page.getByText("原始決策快照")).toBeVisible();
  await expect(page.getByRole("button", { name: "更新快照", exact: true })).toHaveCount(0);
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
  await mockHistory(page);
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

test("選擇歷史日期會更新價格與條件，並標示重建來源與警語", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const requestedDates: Array<string | null> = [];
  page.on("request", (request) => {
    if (monitorEndpoint.test(request.url())) requestedDates.push(new URL(request.url()).searchParams.get("date"));
  });
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
  await expect(stockArticle(page)).not.toContainText("116.40");
  const drawdown = stockArticle(page).getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "峰值回落", exact: true }),
  });
  await expect(drawdown.getByText("13.00%", { exact: true })).toBeVisible();
  await expect(drawdown.getByText("≥ 8.00%", { exact: true })).toBeVisible();
  await expect(stockArticle(page)).toContainText("剩餘 5 天");
  await expect(page.getByLabel("紀錄來源說明").getByText("以當前策略與歷史行情重建", { exact: true })).toBeVisible();
  await page.getByText("查看重建依據與資料限制", { exact: true }).click();
  await expect(page.getByText(reconstructedWarning, { exact: true })).toBeVisible();
  expect(requestedDates).toContain("2026-10-12");
  await page.screenshot({ path: testInfo.outputPath("strategy-history-desktop.png") });
});

test("前後日期按保存紀錄跳轉，首尾按鈕停用且最新決策恢復自動最新", async ({ page }) => {
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  const date = page.getByLabel("決策日期", { exact: true });
  const previous = page.getByRole("button", { name: "前一次", exact: true });
  const next = page.getByRole("button", { name: "後一次", exact: true });
  await expect(stockArticle(page)).toBeVisible();
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  await previous.click();
  await expect(date).toHaveValue("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
  await previous.click();
  await expect(date).toHaveValue("2026-10-08");
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(date).toHaveValue("2026-10-12");
  await page.getByRole("button", { name: "最新決策", exact: true }).click();
  await expect(date).toHaveValue("");
  await expect(stockArticle(page)).toContainText("116.40");
  await expect(next).toBeDisabled();
  await expect(page.getByText(reconstructedWarning, { exact: true })).toHaveCount(0);
});

test("載入其他日期時立即移除舊日期圖表，日期選擇器仍可見", async ({ page }) => {
  await mockHistory(page);
  let releaseRequest: (() => void) | undefined;
  const pending = new Promise<void>((resolve) => { releaseRequest = resolve; });
  await page.route(monitorEndpoint, (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    return date === "2026-10-12"
      ? pending.then(() => route.fulfill({ json: makeReconstructedMonitor() }))
      : route.fulfill({ json: makeStrategyMonitor() });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  try {
    await expect(page.getByLabel("決策日期", { exact: true })).toBeVisible();
    await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("2026-10-12");
    await expect(stockArticle(page)).toHaveCount(0);
  } finally {
    releaseRequest?.();
  }
  await expect(stockArticle(page)).toContainText("104.40");
});

test("所選日期失敗不顯示舊圖，仍可從日期工具列返回最新決策", async ({ page }) => {
  await mockHistory(page);
  await page.route(monitorEndpoint, (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    return date === "2026-10-12"
      ? route.fulfill({ status: 503, json: { error: "This date could not be loaded" } })
      : route.fulfill({ json: makeStrategyMonitor() });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  const date = page.getByLabel("決策日期", { exact: true });
  await date.selectOption("2026-10-12");
  await expect(page.getByRole("button", { name: "重新載入", exact: true })).toBeVisible();
  await expect(stockArticle(page)).toHaveCount(0);
  await expect(date).toBeVisible();
  await expect(date).toHaveValue("2026-10-12");
  await page.getByRole("button", { name: "最新決策", exact: true }).click();
  await expect(stockArticle(page)).toBeVisible();
  await expect(stockArticle(page)).toContainText("116.40");
});

test("日期索引有紀錄但快照不存在時，不沿用其他日期的圖表", async ({ page }) => {
  await mockHistory(page);
  await page.route(monitorEndpoint, (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    return date === "2026-10-12"
      ? route.fulfill({ status: 404, json: { error: "No saved decision for this date" } })
      : route.fulfill({ json: makeStrategyMonitor() });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toBeVisible();
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toHaveCount(0);
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("2026-10-12");
  await expect(page.getByRole("button", { name: "最新決策", exact: true })).toBeEnabled();
});

test("不可用的歷史日期顯示該日原因，仍能選擇其他日期", async ({ page }) => {
  await mockMonitor(page);
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toBeVisible();
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-08");
  await expect(page.getByText(makeUnavailableHistoryMonitor().message, { exact: true })).toBeVisible();
  await expect(stockArticle(page)).toHaveCount(0);
  await expect(page.getByLabel("決策日期", { exact: true })).toBeVisible();
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
});

test("背景取得較新日期不會把使用者選中的歷史決策切回最新", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-13T01:00:00+08:00") });
  let historyRequests = 0;
  await page.route(historyEndpoint, (route) => {
    historyRequests += 1;
    const snapshots = [makeStrategyMonitor(), makeReconstructedMonitor(), makeUnavailableHistoryMonitor()];
    if (historyRequests > 1) {
      const newer = makeStrategyMonitor();
      newer.decision_date = "2026-10-14";
      snapshots.unshift(newer);
    }
    return route.fulfill({ json: makeStrategyMonitorHistory(snapshots) });
  });
  await page.route(monitorEndpoint, (route) => {
    const date = new URL(route.request().url()).searchParams.get("date");
    return route.fulfill({ json: date === "2026-10-12" ? makeReconstructedMonitor() : makeStrategyMonitor() });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toBeVisible();
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
  await page.clock.runFor(3_000);
  await page.clock.fastForward(65_000);
  await expect.poll(() => historyRequests).toBeGreaterThan(1);
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
  await expect(stockArticle(page)).not.toContainText("116.40");
});

test("自動最新的背景更新失敗仍保留已取得快照並提示未更新", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-13T01:00:00+08:00") });
  await mockHistory(page);
  let requests = 0;
  await page.route(monitorEndpoint, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ json: makeStrategyMonitor() })
      : route.fulfill({ status: 503, json: { error: "temporary unavailable" } });
  });
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  // Run initial request cleanup before fast-forwarding the 60-second poll.
  await page.clock.runFor(3_000);
  await page.clock.fastForward(65_000);
  await expect.poll(() => requests).toBeGreaterThan(1);
  await expect(page.getByRole("alert").filter({ hasText: "更新失敗" })).toBeVisible();
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("");
  await expect(stockArticle(page)).toContainText("116.40");
});

test("歷史清單失敗不阻擋最新快照，重試後可選歷史日期", async ({ page }) => {
  let requests = 0;
  await page.route(historyEndpoint, (route) => {
    requests += 1;
    return requests === 1
      ? route.fulfill({ status: 503, json: { error: "temporary unavailable" } })
      : route.fulfill({ json: makeStrategyMonitorHistory() });
  });
  await page.route(monitorEndpoint, (route) => route.fulfill({ json: makeStrategyMonitor() }));
  await page.goto("/strategy_monitor");
  await expect(stockArticle(page)).toContainText("116.40");
  await page.getByRole("button", { name: "重試歷史清單", exact: true }).click();
  await expect(page.getByLabel("決策日期", { exact: true }).locator('option[value="2026-10-12"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: "前一次", exact: true })).toBeEnabled();
  await expect(stockArticle(page)).toContainText("116.40");
});

test("重建尚在進行時呈現已完成數與進度訊息，已保存日期仍可閱讀", async ({ page }) => {
  const history = makeStrategyMonitorHistory();
  history.backfill = { status: "running", completed: 2, total: 8, message: "歷史資料正在逐日重建。" };
  await mockMonitor(page, makeStrategyMonitor(), history);
  await page.goto("/strategy_monitor");
  const progress = page.getByRole("status", { name: "歷史重建進度" });
  await expect(progress).toContainText(/2\s*\/\s*8/);
  await expect(progress).toContainText("歷史資料正在逐日重建。");
  await expect(stockArticle(page)).toBeVisible();
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
});

test("重建失敗顯示後端原因且不影響已保存的原始決策", async ({ page }) => {
  const history = makeStrategyMonitorHistory();
  history.backfill = { status: "failed", completed: 2, total: 8, message: "歷史價格缺漏，重建作業暫時中止。" };
  await mockMonitor(page, makeStrategyMonitor(), history);
  await page.goto("/strategy_monitor");
  await expect(page.getByText("歷史價格缺漏，重建作業暫時中止。", { exact: true })).toBeVisible();
  await expect(stockArticle(page)).toContainText("116.40");
  await expect(page.getByLabel("決策日期", { exact: true })).toBeVisible();
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
  await page.getByLabel("決策日期", { exact: true }).selectOption("2026-10-12");
  await expect(stockArticle(page)).toContainText("104.40");
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("2026-10-12");
  const historyOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(historyOverflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("strategy-history-mobile.png") });
  await page.getByRole("button", { name: "最新決策", exact: true }).click();
  await expect(page.getByLabel("決策日期", { exact: true })).toHaveValue("");
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

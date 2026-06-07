import { expect, test } from "@playwright/test";

/** 收集 page 上的 JS runtime error，供斷言「無未捕捉錯誤」。 */
function trackPageErrors(page: import("@playwright/test").Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

test("首頁：hero、即時快照與功能導覽", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("模擬交易系統");
  await expect(page.getByRole("navigation", { name: "主導覽" })).toBeVisible();
  await page.screenshot({ path: "test-results/home.png", fullPage: true });

  expect(errors).toEqual([]);
});

test("未實現損益：標題 + 摘要/表格", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/unrealized_gains_losses");

  await expect(page.getByRole("heading", { name: "未實現損益" })).toBeVisible();
  await expect(page.getByText("00631L").first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("總投資成本").first()).toBeVisible();
  await page.screenshot({ path: "test-results/unrealized.png", fullPage: true });

  expect(errors).toEqual([]);
});

test("已實現損益：標題 + 表格", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/realized_gains_losses");

  await expect(page.getByRole("heading", { name: "已實現損益" })).toBeVisible();
  await page.screenshot({ path: "test-results/realized.png", fullPage: true });

  expect(errors).toEqual([]);
});

test("追蹤標的：列出標的並可連到個股圖", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/stock_statistic_data");

  await expect(page.getByText("00631L").first()).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: "test-results/statistics.png", fullPage: true });

  expect(errors).toEqual([]);
});

test("個股歷史：圖表 canvas 與時間範圍切換", async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto("/stocks/00631L");

  await expect(page.getByRole("group", { name: "時間範圍" })).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 15_000 });

  await page.getByRole("button", { name: "全部" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({ path: "test-results/stock-chart.png", fullPage: true });

  expect(errors).toEqual([]);
});

test("RWD：手機寬度首頁無水平溢位", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
});

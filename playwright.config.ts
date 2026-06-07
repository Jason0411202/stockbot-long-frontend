import { defineConfig, devices } from "@playwright/test";

/**
 * E2E 設定。預設對 http://localhost:3000 跑測試；
 * 會自動以 `npm run dev` 起前端（若已在跑則重用）。
 * 注意：smoke 測試需要後端可連線（NEXT_PUBLIC_BACKEND_URL 指向的服務）。
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  outputDir: "./test-results",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

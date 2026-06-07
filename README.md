# stockbot-long-frontend

[stockbot-long-backend](https://github.com/Jason0411202/stockbot-long-backend) 的前端儀表板：以 Next.js App Router + TypeScript 打造，呈現台股 ETF 長線／波段策略的**未實現／已實現損益**、**追蹤標的統計**，以及**個股歷史股價與系統買賣決策點**。

資料於 **runtime** 由瀏覽器直接向後端 REST API 抓取（後端 CORS 為 `*`），因此 build 不再依賴後端可連線。

## 技術棧

| 範疇 | 選用 |
| --- | --- |
| 框架 | Next.js 15（App Router） |
| 語言 | TypeScript（strict） |
| 資料抓取 | [SWR](https://swr.vercel.app/)（client-side、stale-while-revalidate） |
| 圖表 | chart.js 4 + react-chartjs-2 5 |
| 樣式 | CSS Modules + design tokens（CSS 變數，無 UI 框架） |
| 測試 | Vitest（單元）、Playwright（E2E smoke） |
| 部署 | Vercel |

## 環境變數

只有一個必要變數：後端 API 的**完整 origin（含協定）**。

```bash
# 本機開發（後端以 go run 起在 :8080，HTTP）
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# 正式環境（Vercel）：請用 HTTPS 網域（後端由 Caddy 提供 TLS），
# 避免瀏覽器 mixed-content 阻擋
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

- 倉庫已附 `.env`（本機預設指向 `http://localhost:8080`）與 `.env.example`（含說明）。
- 需覆寫本機值時，建立 `.env.local`（已被 gitignore）。
- 部署到 Vercel 時，於專案的 **Environment Variables** 設定 `NEXT_PUBLIC_BACKEND_URL`。

## 本機開發

```bash
# 1) 先啟動後端（另一個 repo），預設監聽 :8080
#    見 stockbot-long-backend/docs/development.md（go run，需 DB）

# 2) 安裝相依並啟動前端
npm install
npm run dev
# 開啟 http://localhost:3000
```

> 後端未啟動時，各頁會優雅顯示錯誤狀態（而非崩潰或 build 失敗）。

## 頁面與路由

| 路由 | 內容 |
| --- | --- |
| `/` | 總覽：hero、投資組合即時快照、功能導覽 |
| `/unrealized_gains_losses` | 未實現損益（持倉、即時帳面損益、彙總） |
| `/realized_gains_losses` | 已實現損益（平倉紀錄、彙總） |
| `/stock_statistic_data` | 追蹤標的統計（連到個股圖） |
| `/stocks/[stockId]` | 個股歷史收盤價折線圖 + 買入／賣出標記點 + 時間範圍切換 |

## 與後端對接

API client 集中在 [`src/lib/api/`](src/lib/api/)；型別 [`types.ts`](src/lib/api/types.ts) 鏡射後端 `internal/dto/*.go`。

| 函式（[endpoints.ts](src/lib/api/endpoints.ts)） | 後端路徑 |
| --- | --- |
| `getUnrealizedGainsLosses()` | `GET /api/get_unrealized_gains_losses` |
| `getRealizedGainsLosses()` | `GET /api/get_realized_gains_losses` |
| `getStockStatistics()` | `GET /api/get_stock_statistic_data` |
| `getStockHistory(stockId)` | `GET /api/get_stock_history_data?stockId=…` |

> 後端詳見 <https://github.com/Jason0411202/stockbot-long-backend>（`docs/api.md`）。

## 測試與檢查

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test        # Vitest 單元測試（lib 純邏輯）
npm run test:e2e    # Playwright E2E（需前端在跑 + 後端可連線）
npm run build       # 正式 build（不需後端在線）
```

- 單元測試聚焦純邏輯：彙總計算、圖表資料合併／過濾、格式化、API client 錯誤處理。
- E2E smoke 走訪每個頁面、驗證圖表渲染與時間範圍切換、檢查無 JS 例外與手機寬度無溢位。
- 首次跑 E2E 前需安裝瀏覽器：`npx playwright install chromium`。

## 部署到 Vercel

1. 於 Vercel 匯入此 repo（框架會自動辨識為 Next.js）。
2. 設定環境變數 `NEXT_PUBLIC_BACKEND_URL` 為你的後端 **HTTPS** 網域。
3. Deploy。

## 專案結構

```
src/
├─ app/                 # App Router 頁面（各路由一個 page.tsx）
├─ components/          # 依領域分組：layout / ui / portfolio / stocks / home
├─ hooks/               # SWR 資料抓取 hooks
├─ lib/                 # api/（client、types、endpoints）、format、summary、chart-data
└─ styles/              # design tokens、typography
e2e/                    # Playwright smoke tests
```

## 免責聲明

本系統內容與回測結果僅供工程與研究參考，不構成投資建議；歷史績效不代表未來績效。

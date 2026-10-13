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
| `/strategy_monitor` | 決策歷史：按日期查看各股票買入／賣出門檻圖、冷卻與結果，缺漏自動回補 |
| `/stocks/[stockId]` | 個股歷史收盤價折線圖 + 買入／賣出標記點 + 時間範圍切換 |

## 與後端對接

API client 集中在 [`src/lib/api/`](src/lib/api/)；型別 [`types.ts`](src/lib/api/types.ts) 鏡射後端 `internal/dto/*.go`。

| 函式（[endpoints.ts](src/lib/api/endpoints.ts)） | 後端路徑 |
| --- | --- |
| `getUnrealizedGainsLosses()` | `GET /api/get_unrealized_gains_losses` |
| `getRealizedGainsLosses()` | `GET /api/get_realized_gains_losses` |
| `getStockStatistics()` | `GET /api/get_stock_statistic_data` |
| `getStockHistory(stockId)` | `GET /api/get_stock_history_data?stockId=…` |
| `getStrategyMonitor(date?, revision?)` | `GET /api/get_strategy_monitor?date=YYYY-MM-DD`（省略日期取得最新紀錄） |
| `getStrategyMonitorHistory()` | `GET /api/get_strategy_monitor_history`（日期索引與自動回補進度） |

> 後端詳見 <https://github.com/Jason0411202/stockbot-long-backend>（`docs/api.md`）。

### 策略監控

`/strategy_monitor` 以日期選擇器、前一次／後一次與回到最新取代手動更新快照。
預設最新紀錄，每 60 秒自動讀取；選定歷史日期後保持該日期，不會被背景更新切回最新。
日期清單在回補期間每 10 秒讀取進度，完成後每 60 秒更新。讀取失敗仍可切換日期，且不會用另一日期的圖表替代。
新決策永久保存原始快照：決策價、指標截止日、各股買入前及賣出前條件與成交結果一起寫入帳本交易。
買入與賣出各項主要門檻預設展開，計算細節可另外展開；冷卻是決策當時的日曆天數，另列解除日期。
百分比使用 `8 = 8%`，門檻判定完全由後端提供；前端圖表不重新判斷交易訊號。金額倍率只套用帳本金額。

已有紀錄保持原樣。從機器人帳本開始，有成交或每日權益紀錄的缺漏決策日會在後端自動回補。
回補使用當前策略、歷史行情與帳本還原的狀態；畫面標示「歷史重建」、策略版本及資料限制，不冒充當時保存的原始快照。
原始與重建紀錄皆保存完整圖表資料，日後策略設定改動不影響已保存的歷史。
這是唯讀監控頁，切換日期與自動回補不會執行交易。缺資料會明確顯示原因。

針對早期回補曾以截位單價反推現金的紀錄，後端會另存 `ledger-cashflow-v2` 修正版，採用帳本原始成交總額並沿用初版策略設定。
頁面只顯示修正版，不提供初版切換選單；初版資料仍完整保留於後端。
單日 API 保留 `revision=initial` 或 `revision=ledger-cashflow-v2` 查詢契約。前端只指定已知修正版，其他日期讀取後端預設最新版本；版本與日期共用 SWR cache key，讀取失敗不退回初版圖表。

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

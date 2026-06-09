# 前端需求：歷史策略績效「逐日多指標時間序列」API

> 來源：stockbot-long-frontend · 對象：stockbot-long-backend
> 目的：讓前端「歷史策略績效」頁把**所有有時間軸的績效指標**畫成一張可勾選疊圖，
> 使用者自選要看哪些線做交叉比對（勾選狀態以 cookie 記住），並可選時間區間。

---

## 1. 背景與目標

前端「歷史策略績效」頁要從「兩張固定折線圖」升級為**單一可勾選的多指標疊圖**：

- 一張圖、多條線；每條線是一個績效指標的時間序列。
- 使用者用 checkbox 自選顯示哪些指標（例：同時疊「實盤總權益 + 投入本金 + 策略權益 + 報酬率」交叉比對）。
- 時間區間選擇（1m / 3m / 6m / 1y / 3y / all），沿用個股走勢頁的 RangeSelector。

**前端不該自己重算金融指標**——後端是唯一真實來源。前端只負責畫線與勾選。

## 2. 現況落差

目前後端能畫成時間軸的只有：

| 來源 | 逐日欄位 |
| --- | --- |
| `GET /api/get_equity_history`（實盤） | `date, cash, holding_value, total_equity` |
| `summary.backtest.equity_curve`（回測） | `date, strat_equity, bh_equity` |

其餘指標（**投入本金、總損益、報酬率、本金倍數、年化報酬、最大回撤、已實現／未實現損益、持股／現金佔比**）
在 `get_performance_summary` 都只是**單一當前／全期純量**，沒有逐日序列，前端無法畫時間軸。

## 3. 需求總則（重要：統一時間軸、不拆兩支）

回測會根據實盤結果**每日重跑更新**，其右端（最新日）永遠對齊實盤的「今天」；
實盤帳戶本質上就是同一套策略的真實執行。**因此回測與實盤不應拆成兩支獨立端點**，
而是放在**同一條日期時間軸**上：

- **回測（模擬）欄位**：全期皆有值（自 `span_start` 起，約 2018 → 今天）。
- **實盤（真實）欄位**：僅 go-live 後才有值；go-live 之前為 `null`（用 `null` 區分「尚無真實資料」與「值為 0」）。

如此前端一條 x 軸即可同時呈現「策略長期模擬走勢」與「真實帳戶近期實況」，
真實線自然接續在策略線之上。

## 4. 建議端點與 DTO

建議**新增**端點（不要改動既有 `/api/get_equity_history`、`/api/get_performance_summary` 契約，
避免破壞總覽頁與既有圖）：

```
GET /api/get_performance_history
```

回傳逐日（等距取樣，沿用 ≤400 點上限）的統一績效序列：

```go
// PerformanceHistoryPoint 是 GET /api/get_performance_history 的單筆：某交易日的「統一績效快照」。
// 同一條時間軸同時承載回測(模擬，全期皆有)與實盤(真實，go-live 後才有，之前為 null)，
// 因回測每日依最新資料重跑、與實盤共享右端(今天)，故不拆成兩支端點。
// 比率／倍數型欄位以 JSONFloat 承載（邊界 NaN/Inf → null，沿用既有慣例）。
type PerformanceHistoryPoint struct {
    Date     string  `json:"date"`      // 交易日 (YYYY-MM-DD)，升冪
    Invested float64 `json:"invested"`  // 投入本金到當日 (lump-sum 為常數＝期初本金；含注資則逐日累計)

    // ── 回測 (模擬；全期皆有值) ──
    StratEquity     float64   `json:"strat_equity"`      // [MUST] 策略當日權益
    BHEquity        float64   `json:"bh_equity"`         // [MUST] 買進持有當日權益
    StratMultiple   JSONFloat `json:"strat_multiple"`    // [MUST] 策略本金倍數 = 權益 / 投入本金
    BHMultiple      JSONFloat `json:"bh_multiple"`       // [MUST] B&H 本金倍數
    StratReturnRate JSONFloat `json:"strat_return_rate"` // [MUST] 策略累積報酬率 % = 倍數 − 1
    BHReturnRate    JSONFloat `json:"bh_return_rate"`    // [MUST] B&H 累積報酬率 %
    StratDrawdown   JSONFloat `json:"strat_drawdown"`    // [OPT] 策略到當日滾動最大回撤 % (<=0)
    BHDrawdown      JSONFloat `json:"bh_drawdown"`       // [OPT] B&H 到當日滾動最大回撤 %
    StratCAGR       JSONFloat `json:"strat_cagr"`        // [OPT] 策略到當日年化報酬 %

    // ── 實盤 (真實帳本；go-live 前各欄為 null) ──
    Cash            *float64   `json:"cash"`              // [MUST] 預備現金
    HoldingValue    *float64   `json:"holding_value"`    // [MUST] 持股市值
    TotalEquity     *float64   `json:"total_equity"`     // [MUST] 實盤總權益
    HoldingRatio    *JSONFloat `json:"holding_ratio"`    // [MUST] 持股佔比 %
    CashRatio       *JSONFloat `json:"cash_ratio"`       // [MUST] 現金佔比 %
    TotalPnL        *float64   `json:"total_pnl"`        // [MUST] 總損益 = 實盤總權益 − 投入本金
    TotalReturnRate *JSONFloat `json:"total_return_rate"`// [MUST] 實盤累積報酬率 %
    Multiple        *JSONFloat `json:"multiple"`         // [MUST] 實盤本金倍數
    RealizedPnL     *float64   `json:"realized_pnl"`     // [OPT] 累計已實現損益（到當日）
    UnrealizedPnL   *float64   `json:"unrealized_pnl"`   // [OPT] 當日未實現損益
    CAGR            *JSONFloat `json:"cagr"`             // [OPT] 實盤到當日年化報酬 %（單筆 lump-sum＝XIRR）
    MaxDrawdown     *JSONFloat `json:"max_drawdown"`     // [OPT] 實盤到當日滾動最大回撤 %
}
```

**[MUST]**：前端疊圖的核心線，必備。
**[OPT]**：加值線（滾動回撤、年化、已實現／未實現拆分）；可第二階段補。
（年化／報酬率／倍數雖可由 equity 推導，仍請後端輸出，讓後端為唯一真實來源、並正確處理未來開啟每月注資的情形。）

### JSON 範例（節選兩個日期點）

```json
[
  {
    "date": "2019-05-02",
    "invested": 1000000,
    "strat_equity": 1180000, "bh_equity": 1240000,
    "strat_multiple": 1.18, "bh_multiple": 1.24,
    "strat_return_rate": 18.0, "bh_return_rate": 24.0,
    "strat_drawdown": -8.3, "bh_drawdown": -15.1, "strat_cagr": 12.9,
    "cash": null, "holding_value": null, "total_equity": null,
    "holding_ratio": null, "cash_ratio": null, "total_pnl": null,
    "total_return_rate": null, "multiple": null,
    "realized_pnl": null, "unrealized_pnl": null, "cagr": null, "max_drawdown": null
  },
  {
    "date": "2026-05-11",
    "invested": 1000000,
    "strat_equity": 2418000, "bh_equity": 1905000,
    "strat_multiple": 2.418, "bh_multiple": 1.905,
    "strat_return_rate": 141.8, "bh_return_rate": 90.5,
    "strat_drawdown": -18.4, "bh_drawdown": -47.1, "strat_cagr": 12.9,
    "cash": 372140, "holding_value": 871360, "total_equity": 1243500,
    "holding_ratio": 70.07, "cash_ratio": 29.93, "total_pnl": 243500,
    "total_return_rate": 24.35, "multiple": 1.2435,
    "realized_pnl": 118240, "unrealized_pnl": 125260, "cagr": 24.35, "max_drawdown": -9.8
  }
]
```

## 5. 取樣、單位、邊界與相容性

- **升冪 + 等距取樣 ≤ 400 點**（沿用 `equity_curve` / `equity_history` 既有做法），末日必定入列。
- **單位約定**（前端據此分多 Y 軸）：
  - 金額（TWD）：`invested`、`*_equity`、`holding_value`、`cash`、`*_pnl`
  - 百分比（%）：`*_return_rate`、`*_ratio`、`*_drawdown`、`*_cagr`、`cagr`
  - 倍數（×）：`*_multiple`
- **null 約定**：回測欄位用 `JSONFloat`（NaN/Inf → null）；實盤欄位 go-live 前為 `null`（指標序列開頭也允許 null，例如年化在天數過少時）。
- **空資料**：回 `[]`。
- **報酬率 % 表示**：請用「百分比數值」（24.35 代表 24.35%），與 summary 的 `total_return_rate` 一致；
  避免與回測 ArmMetrics 的「小數比率」(0.129) 不一致——若沿用小數請在文件註明，前端會配合。

## 6. 前端會如何使用

- 一張 chart.js 疊圖，多 Y 軸（金額／百分比／倍數各一軸），每個指標一條 dataset。
- 指標 checkbox 面板；勾選集合存 cookie（跨瀏覽 session 記住）。
- 沿用 RangeSelector（相對序列末日回推過濾）。
- 「歷史策略績效」頁將**移除**與總覽重複的靜態區塊（穩健性 scorecard、交易統計等）——那些留在總覽。

## 7. 驗收標準

1. `GET /api/get_performance_history` 回傳升冪、等距取樣、末日入列的統一序列。
2. 每點含上述 [MUST] 欄位；回測欄位全期有值，實盤欄位 go-live 前為 null。
3. 全新部署（無實盤資料）時：回測欄位仍完整，實盤欄位整段 null；序列從 `span_start` 起。
4. 比率／倍數邊界值為 null（不得讓 JSON 編碼失敗）。
5. 既有 `/api/get_equity_history`、`/api/get_performance_summary` 契約不變。
6. `docs/api.md`、`docs/database-schema.md`（若新增逐日欄位持久化）同步更新。

---

### 附註：哪些是「新算」、哪些後端已有

- `strat_equity / bh_equity`：`equity_curve` 已有，補上 `invested` 即可算 `*_multiple`、`*_return_rate`。
- 實盤 `cash / holding_value / total_equity`：`EquityHistory` 表已逐日存；其餘實盤指標可由這些 + `invested` 當日算出。
- **真正要新增計算的**：滾動最大回撤（running peak，產生曲線時順手算）、年化（CAGR / MWR）、
  已實現／未實現損益的**逐日**值（目前僅當前純量；若要逐日，需在 `EquityHistory` 一併持久化或重算）。
  → 故把這幾項標為 [OPT]，可分階段交付。

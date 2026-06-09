/** 顯示用的數值/日期格式化工具。 */

const TWD = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

const NUMBER_2DP = new Intl.NumberFormat("zh-TW", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 將任意值轉為有限數字；無法解析時回傳 null。
 * 注意：明確排除 null/undefined/空字串，避免 JS 把它們強制轉成 0。 */
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** 金額（新台幣，無小數）；非數字回傳 "—"。 */
export function formatCurrency(value: unknown): string {
  const n = toFiniteNumber(value);
  return n === null ? "—" : TWD.format(n);
}

/** 一般數字（保留 2 位小數）；非數字回傳 "—"。 */
export function formatNumber(value: unknown, fractionDigits = 2): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  if (fractionDigits === 2) return NUMBER_2DP.format(n);
  return new Intl.NumberFormat("zh-TW", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/** 百分比（已是百分比數值，例如 12.3 → "+12.30%"）；非數字回傳 "—"。 */
export function formatPercent(value: unknown): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${NUMBER_2DP.format(n)}%`;
}

/** 已是百分比的數值（例如佔比 73.4 → "73.4%"，不強制正負號）；非數字回傳 "—"。 */
export function formatPercentPlain(value: unknown, fractionDigits = 1): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  return `${formatNumber(n, fractionDigits)}%`;
}

/** 帶正負號的損益金額（例如 +1,234 / -567）；非數字回傳 "—"。 */
export function formatSignedNumber(value: unknown, fractionDigits = 2): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatNumber(n, fractionDigits)}`;
}

/** 本金倍數（例如 1.403 → "1.40×"）；非數字回傳 "—"。 */
export function formatMultiple(value: unknown): string {
  const n = toFiniteNumber(value);
  return n === null ? "—" : `${NUMBER_2DP.format(n)}×`;
}

/**
 * 比率轉百分比（後端以小數承載：0.047 → "4.70%"、-0.227 → "-22.70%"）；非數字回傳 "—"。
 * @param signed 為 true 時正值加上 "+"（用於報酬類，負值本就帶 "-"）。
 */
export function formatRatioPercent(value: unknown, signed = false): string {
  const n = toFiniteNumber(value);
  if (n === null) return "—";
  const pct = n * 100;
  const sign = signed && pct > 0 ? "+" : "";
  return `${sign}${NUMBER_2DP.format(pct)}%`;
}

/** 損益方向：用於語意色（profit / loss / neutral）。 */
export type Trend = "profit" | "loss" | "neutral";

export function trendOf(value: unknown): Trend {
  const n = toFiniteNumber(value);
  if (n === null || n === 0) return "neutral";
  return n > 0 ? "profit" : "loss";
}

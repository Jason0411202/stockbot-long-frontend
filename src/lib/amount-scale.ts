import { toFiniteNumber } from "./format";

/** 只接受有限且大於 0 的倍率；無效 cookie / 輸入回傳 null。 */
export function normalizeAmountScale(value: unknown): number | null {
  const scale = toFiniteNumber(value);
  return scale !== null && scale > 0 ? scale : null;
}

/** 接受使用者常見的千分位逗號與空白。 */
export function parseCapitalInput(value: string): number | null {
  return normalizeAmountScale(value.replaceAll(",", "").replaceAll("，", "").trim());
}

/** 將倍率收斂至足夠顯示且適合寫入 cookie 的精度。 */
export function roundAmountScale(value: number): number | null {
  const scale = normalizeAmountScale(value);
  if (scale === null) return null;
  return Number(scale.toPrecision(12));
}

/** 依「使用者總資金 ÷ 模擬帳本總權益」計算顯示倍率。 */
export function calculateAmountScale(capital: unknown, liveEquity: unknown): number | null {
  const normalizedCapital = normalizeAmountScale(capital);
  const normalizedEquity = normalizeAmountScale(liveEquity);
  if (normalizedCapital === null || normalizedEquity === null) return null;
  return roundAmountScale(normalizedCapital / normalizedEquity);
}

export function formatScale(scale: number): string {
  return new Intl.NumberFormat("zh-TW", {
    maximumSignificantDigits: 8,
  }).format(scale);
}

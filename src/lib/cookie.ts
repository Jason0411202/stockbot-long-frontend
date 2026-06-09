/** 極簡 cookie 讀寫（client-only；SSR 環境 document 不存在時安全略過）。 */

/** 讀取 cookie 值；不存在或在伺服器端回傳 null。 */
export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  return hit ? decodeURIComponent(hit.slice(prefix.length)) : null;
}

/** 寫入 cookie（預設保存一年，path=/，SameSite=Lax）。伺服器端安全略過。 */
export function writeCookie(name: string, value: string, maxAgeDays = 365): void {
  if (typeof document === "undefined") return;
  const maxAge = Math.round(maxAgeDays * 86_400);
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

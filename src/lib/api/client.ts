/**
 * 集中式 API client。
 *
 * 後端 base URL 由 NEXT_PUBLIC_BACKEND_URL 提供（含協定的完整 origin），
 * 解決舊版把 `https://` 硬寫死、連不上本機 http://localhost:8080 的問題。
 *
 * 後端 CORS 設為 `*`，故瀏覽器可直接 client-side 連線，不需 proxy。
 */

/** 取得正規化後（去掉結尾斜線）的後端 base URL；未設定時丟出明確錯誤。 */
export function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!raw || raw.trim() === "") {
    throw new ApiError(
      "未設定 NEXT_PUBLIC_BACKEND_URL，無法連線後端。請參考 .env.example 設定後端 origin。",
    );
  }
  return raw.trim().replace(/\/+$/, "");
}

/** API 呼叫錯誤；附帶 HTTP 狀態碼（若有）。 */
export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * 對後端發出 GET 並回傳解析後的 JSON。
 * @param path 以 `/` 開頭的 API 路徑，例如 `/api/get_unrealized_gains_losses`
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${getBackendBaseUrl()}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (cause) {
    throw new ApiError(
      `無法連線後端（${url}）：${cause instanceof Error ? cause.message : "未知錯誤"}`,
    );
  }

  if (!response.ok) {
    throw new ApiError(`後端回應 ${response.status}（${path}）`, response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(`後端回應非合法 JSON（${path}）`, response.status);
  }
}

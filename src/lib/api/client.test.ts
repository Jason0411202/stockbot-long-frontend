import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, getBackendBaseUrl } from "./client";

describe("getBackendBaseUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("未設定 NEXT_PUBLIC_BACKEND_URL 時丟出 ApiError", () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "");
    expect(() => getBackendBaseUrl()).toThrow(ApiError);
  });

  it("去除結尾斜線", () => {
    vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8080/");
    expect(getBackendBaseUrl()).toBe("http://localhost:8080");
  });
});

describe("apiGet", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8080"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("成功時回傳解析後的 JSON，並組出正確 URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => [{ a: 1 }] });
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGet("/api/x")).resolves.toEqual([{ a: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8080/api/x",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("非 2xx 回應丟出帶狀態碼的 ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }),
    );
    await expect(apiGet("/api/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
  });

  it("連線失敗丟出 ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(apiGet("/api/x")).rejects.toBeInstanceOf(ApiError);
  });

  it("回應非合法 JSON 丟出 ApiError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("bad json");
        },
      }),
    );
    await expect(apiGet("/api/x")).rejects.toBeInstanceOf(ApiError);
  });
});

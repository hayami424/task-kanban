import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { checkSupabaseConnection } from "@/lib/supabase/checkConnection";

const testUrl = "https://example.supabase.co";
const testKey = "sb_publishable_test";

describe("checkSupabaseConnection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", testUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", testKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("ヘルスチェックが 200 を返すと接続成功になる", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: true, url: testUrl });
    expect(fetchMock).toHaveBeenCalledWith(`${testUrl}/auth/v1/health`, {
      headers: { apikey: testKey },
    });
  });

  test("ヘルスチェックが 401 を返すとステータス付きで接続失敗になる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 401 })));

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, reason: "HTTP 401" });
  });

  test("ネットワークエラーが発生するとエラーメッセージ付きで接続失敗になる", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));

    const result = await checkSupabaseConnection();

    expect(result).toEqual({ ok: false, reason: "fetch failed" });
  });

  test("URL が未設定だと通信せずに接続失敗になる", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("公開キーが未設定だと通信せずに接続失敗になる", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkSupabaseConnection();

    expect(result.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

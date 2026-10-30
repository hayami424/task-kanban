import { getSupabaseEnv } from "./env";

export type ConnectionResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

// Supabase の Auth ヘルスチェックエンドポイントに問い合わせて疎通を確認する
export async function checkSupabaseConnection(): Promise<ConnectionResult> {
  const env = getSupabaseEnv();
  if (!env) {
    return {
      ok: false,
      reason:
        "環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が未設定です",
    };
  }

  try {
    const response = await fetch(`${env.url}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
    });
    if (!response.ok) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    return { ok: true, url: env.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, reason: message };
  }
}

import { checkSupabaseConnection } from "@/lib/supabase/checkConnection";

// Next.js サーバー起動時に1回だけ呼ばれる
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const result = await checkSupabaseConnection();
  if (!result.ok) {
    console.error(`[Supabase] 接続失敗: ${result.reason}`);
  }
}

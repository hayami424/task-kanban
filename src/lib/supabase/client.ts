import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";

// Client Component 用の Supabase クライアント
export function createClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}

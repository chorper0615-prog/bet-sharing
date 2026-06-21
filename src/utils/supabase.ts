import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null | undefined;

function getSupabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  };
}

export function getSupabaseSetupMessage(): string | null {
  const { url, anonKey } = getSupabaseConfig();
  if (url && anonKey) return null;
  return '请先配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，才能使用赌注共享。';
}

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient !== undefined) return cachedClient;

  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}

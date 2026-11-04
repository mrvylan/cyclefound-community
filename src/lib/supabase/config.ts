/** Read public env with static access so Next can inline NEXT_PUBLIC_* into the client bundle. */
export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return {
    url: url.trim(),
    key: key.trim(),
  };
}

export function hasSupabaseConfig() {
  const { url, key } = getSupabasePublicEnv();
  return Boolean(url && key);
}

export function requireSupabaseEnv() {
  const { url, key } = getSupabasePublicEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (same project as cyclefound.com).",
    );
  }
  return { url, key };
}

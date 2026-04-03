const rawSupabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const rawSupabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const urlValid = isValidUrl(rawSupabaseUrl);

if (__DEV__) {
  console.log('[env] SUPABASE_URL present:', rawSupabaseUrl.length > 0);
  console.log('[env] SUPABASE_URL valid:', urlValid);
  console.log('[env] SUPABASE_URL starts with:', rawSupabaseUrl.slice(0, 10));
  console.log('[env] ANON_KEY present:', rawSupabaseAnonKey.length > 0);
}

export const env = {
  supabaseUrl: rawSupabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  isSupabaseConfigured: Boolean(rawSupabaseUrl && rawSupabaseAnonKey && urlValid),
};

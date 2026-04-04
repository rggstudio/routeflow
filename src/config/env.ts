const rawSupabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const rawSupabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
const rawMapboxKey = (process.env.EXPO_PUBLIC_MAPBOX_KEY ?? '').trim();

const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const urlValid = isValidUrl(rawSupabaseUrl);

export const env = {
  supabaseUrl: rawSupabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  isSupabaseConfigured: Boolean(rawSupabaseUrl && rawSupabaseAnonKey && urlValid),
  mapboxKey: rawMapboxKey,
  isMapboxConfigured: Boolean(rawMapboxKey),
};

import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const rawSupabaseUrl = (
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined) ||
  extra.supabaseUrl ||
  ''
).trim();

const rawSupabaseAnonKey = (
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined) ||
  extra.supabaseAnonKey ||
  ''
).trim();

const rawMapboxKey = (
  (process.env.EXPO_PUBLIC_MAPBOX_KEY as string | undefined) ||
  extra.mapboxKey ||
  ''
).trim();

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

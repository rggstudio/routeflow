import Constants from 'expo-constants';

type ExpoManifestLike = {
  extra?: Record<string, string>;
};

type ConstantsWithManifestFallbacks = typeof Constants & {
  manifest?: ExpoManifestLike | null;
  manifest2?: {
    extra?: Record<string, string>;
  } | null;
};

const constantsWithFallbacks = Constants as ConstantsWithManifestFallbacks;

const extra = (
  Constants.expoConfig?.extra ??
  constantsWithFallbacks.manifest2?.extra ??
  constantsWithFallbacks.manifest?.extra ??
  {}
) as Record<string, string>;

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

const rawGoogleIosClientId = (
  (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined) ||
  extra.googleIosClientId ||
  ''
).trim();

const rawGoogleWebClientId = (
  (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined) ||
  extra.googleWebClientId ||
  ''
).trim();

const rawSiteUrl = (
  (process.env.EXPO_PUBLIC_SITE_URL as string | undefined) ||
  extra.siteUrl ||
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

const supabaseHost = urlValid ? new URL(rawSupabaseUrl).host : '';

const isRealClientId = (id: string) =>
  Boolean(id) && !id.startsWith('REPLACE_WITH');

export const env = {
  supabaseUrl: rawSupabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  supabaseHost,
  isSupabaseConfigured: Boolean(rawSupabaseUrl && rawSupabaseAnonKey && urlValid),
  mapboxKey: rawMapboxKey,
  isMapboxConfigured: Boolean(rawMapboxKey),
  googleIosClientId: rawGoogleIosClientId,
  googleWebClientId: rawGoogleWebClientId,
  isGoogleSignInConfigured: isRealClientId(rawGoogleIosClientId),
  siteUrl: rawSiteUrl,
};

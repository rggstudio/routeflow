const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo ?? {};

  return {
    ...appJson,
    expo: {
      ...expo,
      extra: {
        ...(expo.extra ?? {}),
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        mapboxKey: process.env.EXPO_PUBLIC_MAPBOX_KEY ?? process.env.MAPBOX_PUBLIC_KEY ?? '',
        googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
        siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? '',
      },
    },
  };
};

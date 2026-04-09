module.exports = () => {
  return {
    expo: {
      name: "RouteFlow",
      slug: "routeflow",
      owner: "rggstudio",
      version: "1.0.6",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      scheme: "routeflow",
      splash: {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "app.replit.routeflow-rgg",
        appleTeamId: "5BNC3BC2C6",
        usesAppleSignIn: true,
        buildNumber: "6",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
        },
      },
      android: {
        package: "app.replit.routeflow_rgg",
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff",
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
      },
      web: {
        favicon: "./assets/favicon.png",
      },
      plugins: [
        "expo-font",
        "expo-apple-authentication",
        "expo-notifications",
        "expo-secure-store",
        "@react-native-community/datetimepicker",
        "expo-web-browser",
        [
          "@react-native-google-signin/google-signin",
          {
            iosUrlScheme:
              "com.googleusercontent.apps.809975300407-dibhscai7ejtv378rtcotdo71lrja15t",
          },
        ],
      ],
      extra: {
        eas: {
          projectId: "e3bbb904-9642-4dcd-97e1-a24d3db4c788",
        },
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
        mapboxKey:
          process.env.EXPO_PUBLIC_MAPBOX_KEY ??
          process.env.MAPBOX_PUBLIC_KEY ??
          "",
        googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
        siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? "",
      },
    },
  };
};

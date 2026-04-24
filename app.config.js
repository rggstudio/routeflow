module.exports = () => {
  return {
    expo: {
      name: "RouteFlow",
      slug: "routeflow",
      owner: "rggstudio",
      version: "1.0.7",
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
        buildNumber: "10",
        infoPlist: {
          ITSAppUsesNonExemptEncryption: false,
          NSCameraUsageDescription:
            "RouteFlow Driver uses the camera only if you choose to take a driver profile photo, for example when updating your account avatar.",
          NSPhotoLibraryUsageDescription:
            "RouteFlow Driver uses your photo library only when you choose a driver profile photo, for example selecting an image for your account avatar.",
          NSPhotoLibraryAddUsageDescription:
            "RouteFlow Driver may save generated report images to your photo library only when you choose to export or share them.",
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
        "expo-apple-authentication",
        "expo-notifications",
        "expo-secure-store",
        "@react-native-community/datetimepicker",
        "expo-web-browser",
        [
          "expo-image-picker",
          {
            cameraPermission:
              "RouteFlow Driver uses the camera only if you choose to take a driver profile photo, for example when updating your account avatar.",
            photosPermission:
              "RouteFlow Driver uses your photo library only when you choose a driver profile photo, for example selecting an image for your account avatar.",
          },
        ],
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
        EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
        EXPO_PUBLIC_SUPABASE_ANON_KEY:
          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
        EXPO_PUBLIC_MAPBOX_KEY:
          process.env.EXPO_PUBLIC_MAPBOX_KEY ??
          process.env.MAPBOX_PUBLIC_KEY ??
          "",
        EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
        EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
          process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
        EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL ?? "",
      },
    },
  };
};

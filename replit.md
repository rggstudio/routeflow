# RouteFlow

A mobile-first application for independent transportation drivers to manage ride assignments, scheduling, and earnings tracking.

## Tech Stack

- **Framework**: Expo (React Native) with TypeScript
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend/Database**: Supabase (PostgreSQL + Auth)
- **Navigation**: React Navigation (Native Stack)
- **State**: React Context API + AsyncStorage for local persistence
- **Build**: Metro bundler via Expo CLI

## Project Structure

```
├── App.tsx               # Root component
├── index.ts              # App registration
├── app.config.js         # Expo configuration (replaces app.json; exposes MAPBOX_PUBLIC_KEY via extra)
├── src/
│   ├── components/       # Reusable UI components
│   ├── config/           # Environment variable management (env.ts)
│   ├── lib/              # Utilities (supabase.ts, date.ts, routeFlow.ts)
│   ├── navigation/       # Navigation config (RootNavigator.tsx)
│   ├── providers/        # Context providers (RouteFlowProvider, SessionProvider)
│   ├── screens/          # App screens (Home, Today, Week, Earnings, etc.)
│   └── types/            # TypeScript types and interfaces
├── supabase/
│   └── migrations/       # SQL migration files
├── assets/               # Icons, splash screens
└── docs/                 # PRD and setup documentation
```

## Running the App

The app runs via the "Start application" workflow which starts the Expo web server on port 5000.

```bash
npx expo start --web --port 5000
```

## Environment Variables

Requires Supabase credentials (optional - app gracefully handles missing config):
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `MAPBOX_PUBLIC_KEY` - Mapbox token for address autocomplete (accessed via `Constants.expoConfig.extra.mapboxKey`)

## Key Features

- **Today Screen**: Daily command center for drivers
- **Week Screen**: Weekly schedule overview
- **Earnings & Reports**: Track income and generate shareable weekly reports
- **Ride Management**: Support for one-time and recurring rides with address autocomplete (Mapbox Search Box API)
- **Deep Linking**: Integration with Waze, Google Maps, and Apple Maps
- **Authentication**: Email/password and Google OAuth via Supabase

## EAS Build & App Store Submission

EAS CLI is installed as a dev dependency (`node_modules/.bin/eas`). Authenticated as `rggstudio` (raymond@rggstudio.com) via `EXPO_TOKEN`.

**Apple credentials configured in `eas.json` submit.production.ios:**
- `appleTeamId`: `5BNC3BC2C6`
- `ascApiKeyId`: `JQ7G268362`
- `ascApiKeyIssuerId`: `448619fa-ff25-4b7f-9bd5-a21332e40d2d`
- `ascApiKeyPath`: `./apple_key.p8` (gitignored via `*.p8` pattern)
- `ascAppId`: `6761651727`

**Commands:**
```bash
# Register device for internal dev build (run once per device)
./node_modules/.bin/eas device:create

# Development build (install on device for live testing)
./node_modules/.bin/eas build --platform ios --profile development

# Production build + auto-submit to App Store Connect
./node_modules/.bin/eas build --platform ios --profile production --auto-submit
```

## Notable Implementation Notes

- `app.config.js` is the single source of truth for Expo config (no `app.json`). All config is inlined; env vars are injected via `process.env.EXPO_PUBLIC_*`. Passes all 17/17 `expo-doctor` checks.
- Newly installed packages (SDK 54 compatible): `expo-font` (peer dep of `@expo/vector-icons`), `expo-system-ui` (needed for `userInterfaceStyle: automatic` on Android), `react-native-worklets` (peer dep of `react-native-reanimated`).
- Android `package` identifier added: `app.replit.routeflow_rgg`.
- `AddressAutocomplete` component (`src/components/AddressAutocomplete.tsx`) uses Mapbox `/suggest` + `/retrieve` endpoints with 300 ms debounce and a per-form-session UUID token.
- DB audit trigger bug fix: `supabase/migrations/202604030001_fix_audit_fk_on_delete.sql` must be applied via Supabase SQL Editor (sets FK to NULL on delete so audit triggers don't reference already-deleted rows).

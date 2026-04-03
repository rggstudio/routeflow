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
├── app.json              # Expo configuration
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

## Key Features

- **Today Screen**: Daily command center for drivers
- **Week Screen**: Weekly schedule overview
- **Earnings & Reports**: Track income and generate shareable weekly reports
- **Ride Management**: Support for one-time and recurring rides
- **Deep Linking**: Integration with Waze, Google Maps, and Apple Maps
- **Authentication**: Email/password and Google OAuth via Supabase

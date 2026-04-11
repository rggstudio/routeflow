# EAS iOS build migration

This repo is now set up for a standard Expo-managed workflow:

- `npm run build:ios:production`
- `npm run build:ios:local`
- `npm run submit:ios:production`

What to configure in EAS:

1. Log in on your machine with `npx eas-cli login`.
2. Confirm the project is linked to the correct Expo account with `npx eas-cli project:info`.
3. In the Expo dashboard for this project, add these environment variables for the `production` environment:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_MAPBOX_KEY`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
4. Add `EXPO_PUBLIC_SITE_URL` only if you still need the Expo Go web redirect flow during auth testing.
5. Run `npx eas-cli credentials` and make sure the iOS distribution certificate and provisioning profile are owned by your Apple Developer account.

What to configure in App Store Connect:

1. Make sure the app already exists under bundle identifier `app.replit.routeflow-rgg`.
2. Create an App Store Connect API key with at least Developer access.
3. On your machine, store the `.p8` key outside the repo.
4. Run `npx eas-cli submit -p ios --latest` once and either:
   - let EAS prompt for the API key details, or
   - set them in your local submit flow when prompted.
5. Verify the App Store Connect app record matches the current app and team before the first submit.

Recommended ship flow from your machine:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run doctor`
4. `npm run build:ios:production`
5. `npm run submit:ios:production`

Notes:

- `build:ios:local` uses the `development` profile for local debugging.
- `submit:ios:production` submits the latest completed iOS build.
- No bundle identifier change was made as part of this migration.

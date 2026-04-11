# RouteFlow/AGENTS.md

- Expo mobile app.
- Main priority is stable store-ready builds and fast QA.
- Prefer Expo-safe solutions and avoid unnecessary native churn.

## Validation
- Run: npm run lint
- Run: npm run typecheck
- Run: npm run doctor
- For release work, run the appropriate build command and report the exact profile used.

## Dev actions
- Local dev: npm run start
- Device launch: npm run ios / npm run android

## Release actions
- Production iOS build: npm run build:ios:production
- Local debug build: npm run build:ios:local
- Submit to App Store Connect/TestFlight: npm run submit:ios:production

## High-risk areas
- Apple Sign In
- Google Sign In
- notifications
- deep links
- image picker / sharing
- secure storage
- Supabase auth/session flows

## Guardrails
- Treat crash fixes, release blockers, and store-review blockers as highest priority.
- Summaries must include a QA checklist for the changed flow.
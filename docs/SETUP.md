# RouteFlow Setup

## Included stack

- Expo with React Native
- TypeScript
- NativeWind
- React Navigation native stack
- AsyncStorage-backed local persistence for the mobile MVP
- Supabase client for auth and Postgres access when backend sync is enabled
- Supabase SQL migration aligned to the RouteFlow ride model

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a local env file from the example:

```bash
copy .env.example .env.local
```

3. Add your Supabase values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Start Expo:

```bash
npm start
```

## Supabase setup

1. Create a Supabase project.
2. Copy the project URL and anon key into `.env.local`.
3. Run the SQL in `supabase/migrations/202604010001_init_mvp.sql` inside the Supabase SQL editor, or use the Supabase CLI if you prefer migrations locally.
4. The app currently ships as local-first on device storage, but the migration now matches the PRD entities so syncing to Supabase later does not require a schema rewrite.

## Current app structure

- `src/navigation` contains the stack for the dashboard, ride detail, ride form, and weekly report flows.
- `src/providers/RouteFlowProvider.tsx` owns the local ride store, recurrence generation, and persistence.
- `src/screens` contains the RouteFlow MVP surfaces: Today, Week, Earnings, Account, Ride Detail, Ride Form, and Weekly Report.
- `src/providers/SessionProvider.tsx` keeps optional Supabase auth ready without blocking the MVP.
- `supabase/migrations` contains the PRD-aligned backend schema for `trip_groups`, `trip_occurrences`, and `trip_legs`.

## Data model

- `trip_groups`
- `driver_id`
- `rider_name`
- `phone`
- `trip_type`
- `pay_amount`
- `recurrence_type`
- `recurrence_days`
- `notes`

- `trip_occurrences`
- `trip_group_id`
- `service_date`
- `status`
- `override_pay_amount`

- `trip_legs`
- `trip_occurrence_id`
- `leg_type`
- `pickup_address`
- `dropoff_address`
- `pickup_time`
- `status`

## Suggested next steps

- Add a Supabase repository layer so the local store can sync with `trip_groups`, `trip_occurrences`, and `trip_legs`.
- Add Expo Print if you want true PDF generation from the weekly report screen.
- Add notifications and background reminders only after the daily workflow is stable.

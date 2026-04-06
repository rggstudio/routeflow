alter table public.driver_preferences
  add column if not exists first_ride_summary_enabled boolean not null default true,
  add column if not exists first_ride_summary_lead_time_minutes integer not null default 60
    check (first_ride_summary_lead_time_minutes in (15, 30, 60));

alter table public.driver_preferences
  add column if not exists first_ride_summary_time text;

update public.driver_preferences
set first_ride_summary_time = '06:00'
where first_ride_summary_time is null;

alter table public.driver_preferences
  alter column first_ride_summary_time set default '06:00',
  alter column first_ride_summary_time set not null;

alter table public.driver_preferences
  drop constraint if exists driver_preferences_first_ride_summary_lead_time_minutes_check;

alter table public.driver_preferences
  drop constraint if exists driver_preferences_first_ride_summary_time_check;

alter table public.driver_preferences
  add constraint driver_preferences_first_ride_summary_time_check
  check (first_ride_summary_time ~ '^(0\d|10|11):[0-5]\d$');

alter table public.driver_preferences
  drop column if exists first_ride_summary_lead_time_minutes;

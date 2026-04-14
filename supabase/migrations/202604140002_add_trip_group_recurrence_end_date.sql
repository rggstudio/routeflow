alter table public.trip_groups
  add column if not exists recurrence_end_date date;

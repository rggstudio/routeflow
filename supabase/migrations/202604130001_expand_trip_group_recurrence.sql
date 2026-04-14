alter table public.trip_groups
  drop constraint if exists trip_groups_recurrence_type_check;

alter table public.trip_groups
  add column if not exists recurrence_interval integer not null default 1,
  add column if not exists recurrence_anchor_date date not null default current_date,
  add column if not exists recurrence_monthly_mode text;

alter table public.trip_groups
  drop constraint if exists trip_groups_recurrence_interval_check,
  add constraint trip_groups_recurrence_interval_check check (recurrence_interval > 0),
  drop constraint if exists trip_groups_recurrence_monthly_mode_check,
  add constraint trip_groups_recurrence_monthly_mode_check
    check (recurrence_monthly_mode in ('day_of_month', 'nth_weekday') or recurrence_monthly_mode is null);

update public.trip_groups as trip_group
set
  recurrence_days = case
    when trip_group.recurrence_type = 'weekday' then array[1, 2, 3, 4, 5]
    else trip_group.recurrence_days
  end,
  recurrence_type = case
    when trip_group.recurrence_type in ('weekday', 'custom') then 'weekly'
    else trip_group.recurrence_type
  end,
  recurrence_interval = 1,
  recurrence_anchor_date = coalesce(
    (
      select min(occurrence.service_date)
      from public.trip_occurrences as occurrence
      where occurrence.trip_group_id = trip_group.id
    ),
    trip_group.recurrence_anchor_date,
    current_date
  ),
  recurrence_monthly_mode = null;

alter table public.trip_groups
  drop constraint if exists trip_groups_recurrence_type_check,
  add constraint trip_groups_recurrence_type_check
    check (recurrence_type in ('none', 'weekly', 'monthly'));

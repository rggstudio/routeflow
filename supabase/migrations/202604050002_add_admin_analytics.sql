alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles p
set is_admin = true
where lower(coalesce((auth.jwt()->>'email'), '')) = 'shopmaster73@gmail.com'
   or exists (
     select 1
     from auth.users u
     where u.id = p.id
       and lower(coalesce(u.email, '')) = 'shopmaster73@gmail.com'
   );

create or replace function public.current_user_is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        coalesce(p.is_admin, false)
        or lower(coalesce(auth.jwt()->>'email', '')) = 'shopmaster73@gmail.com'
      )
  );
$$;

grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.admin_driver_stats(
  report_date date default timezone('utc', now())::date
)
returns table (
  driver_id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  is_admin boolean,
  active_riders bigint,
  total_trip_groups bigint,
  rides_today bigint,
  completed_rides_week bigint,
  canceled_rides_week bigint,
  dropoffs_week bigint,
  upcoming_rides bigint,
  next_pickup_at timestamptz,
  last_activity_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
declare
  week_start date := report_date - (extract(isodow from report_date)::int - 1);
  week_end date := week_start + 6;
begin
  if not public.current_user_is_admin() then
    raise exception 'Only admins can access driver stats.';
  end if;

  return query
  with base_drivers as (
    select
      p.id,
      p.full_name,
      p.created_at,
      p.is_admin,
      u.email
    from public.profiles p
    left join auth.users u on u.id = p.id
  )
  select
    d.id as driver_id,
    d.full_name,
    d.email,
    d.created_at,
    d.is_admin,
    coalesce(riders.active_riders, 0) as active_riders,
    coalesce(groups.total_trip_groups, 0) as total_trip_groups,
    coalesce(today_stats.rides_today, 0) as rides_today,
    coalesce(week_completed.completed_rides_week, 0) as completed_rides_week,
    coalesce(week_canceled.canceled_rides_week, 0) as canceled_rides_week,
    coalesce(dropoffs.dropoffs_week, 0) as dropoffs_week,
    coalesce(upcoming.upcoming_rides, 0) as upcoming_rides,
    next_pickup.next_pickup_at,
    activity.last_activity_at
  from base_drivers d
  left join lateral (
    select count(*)::bigint as total_trip_groups
    from public.trip_groups g
    where g.driver_id = d.id
  ) groups on true
  left join lateral (
    select count(distinct g.rider_name)::bigint as active_riders
    from public.trip_groups g
    where g.driver_id = d.id
  ) riders on true
  left join lateral (
    select count(*)::bigint as rides_today
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date = report_date
  ) today_stats on true
  left join lateral (
    select count(*)::bigint as completed_rides_week
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date between week_start and week_end
      and o.status = 'completed'
  ) week_completed on true
  left join lateral (
    select count(*)::bigint as canceled_rides_week
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date between week_start and week_end
      and o.status in ('canceled', 'canceled_paid')
  ) week_canceled on true
  left join lateral (
    select count(*)::bigint as dropoffs_week
    from public.trip_legs l
    join public.trip_occurrences o on o.id = l.trip_occurrence_id
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date between week_start and week_end
      and l.status = 'completed'
  ) dropoffs on true
  left join lateral (
    select count(*)::bigint as upcoming_rides
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date >= report_date
      and o.status not in ('completed', 'canceled', 'canceled_paid')
  ) upcoming on true
  left join lateral (
    select min(timezone('utc', o.service_date::timestamp + l.pickup_time)) as next_pickup_at
    from public.trip_legs l
    join public.trip_occurrences o on o.id = l.trip_occurrence_id
    join public.trip_groups g on g.id = o.trip_group_id
    where g.driver_id = d.id
      and o.service_date >= report_date
      and l.status not in ('completed', 'canceled', 'canceled_paid')
  ) next_pickup on true
  left join lateral (
    select max(a.created_at) as last_activity_at
    from public.ride_audit_log a
    where a.driver_id = d.id
  ) activity on true
  where d.email is not null
     or groups.total_trip_groups > 0
  order by
    coalesce(today_stats.rides_today, 0) desc,
    coalesce(upcoming.upcoming_rides, 0) desc,
    coalesce(d.full_name, d.email, 'Driver');
end;
$$;

grant execute on function public.admin_driver_stats(date) to authenticated;

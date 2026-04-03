create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.sync_trip_occurrence_status_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.status_changed_at = coalesce(new.status_changed_at, timezone('utc', now()));

    if new.status = 'completed' and new.completed_at is null then
      new.completed_at = timezone('utc', now());
    end if;

    if new.status in ('canceled', 'canceled_paid') and new.canceled_at is null then
      new.canceled_at = timezone('utc', now());
    end if;

    return new;
  end if;

  if new.status is distinct from old.status then
    new.status_changed_at = timezone('utc', now());

    if new.status = 'completed' and old.status is distinct from 'completed' then
      new.completed_at = coalesce(new.completed_at, timezone('utc', now()));
    end if;

    if new.status in ('canceled', 'canceled_paid')
       and old.status is distinct from new.status then
      new.canceled_at = coalesce(new.canceled_at, timezone('utc', now()));
    end if;
  end if;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.driver_preferences (
  driver_id uuid primary key references public.profiles (id) on delete cascade,
  default_navigation_app text not null default 'google_maps'
    check (default_navigation_app in ('waze', 'google_maps', 'apple_maps')),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_groups (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  rider_name text not null,
  phone text,
  trip_type text not null check (trip_type in ('single', 'round_trip')),
  pay_amount numeric(10, 2) not null default 0,
  recurrence_type text not null default 'none' check (recurrence_type in ('none', 'weekday', 'custom')),
  recurrence_days integer[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_occurrences (
  id uuid primary key default gen_random_uuid(),
  trip_group_id uuid not null references public.trip_groups (id) on delete cascade,
  service_date date not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'canceled', 'canceled_paid')),
  override_pay_amount numeric(10, 2),
  status_changed_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  canceled_at timestamptz,
  cancellation_reason text,
  verification_note text,
  verification_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.trip_legs (
  id uuid primary key default gen_random_uuid(),
  trip_occurrence_id uuid not null references public.trip_occurrences (id) on delete cascade,
  leg_type text not null check (leg_type in ('outbound', 'return')),
  pickup_address text not null,
  dropoff_address text not null,
  pickup_time time not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'in_progress', 'completed', 'canceled', 'canceled_paid')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ride_audit_log (
  id uuid primary key default gen_random_uuid(),
  trip_group_id uuid references public.trip_groups (id) on delete cascade,
  trip_occurrence_id uuid references public.trip_occurrences (id) on delete cascade,
  trip_leg_id uuid references public.trip_legs (id) on delete cascade,
  driver_id uuid references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null default auth.uid(),
  entity_type text not null check (entity_type in ('trip_group', 'trip_occurrence', 'trip_leg')),
  action text not null
    check (action in ('insert', 'update', 'delete', 'status_changed', 'completed', 'paid_cancel', 'verification')),
  old_data jsonb,
  new_data jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_trip_groups_driver_id
  on public.trip_groups (driver_id);

create index if not exists idx_trip_occurrences_group_id
  on public.trip_occurrences (trip_group_id);

create index if not exists idx_trip_occurrences_service_date
  on public.trip_occurrences (service_date);

create index if not exists idx_trip_occurrences_status
  on public.trip_occurrences (status);

create index if not exists idx_trip_legs_occurrence_id
  on public.trip_legs (trip_occurrence_id);

create index if not exists idx_ride_audit_log_group_id
  on public.ride_audit_log (trip_group_id);

create index if not exists idx_ride_audit_log_occurrence_id
  on public.ride_audit_log (trip_occurrence_id);

create index if not exists idx_ride_audit_log_created_at
  on public.ride_audit_log (created_at desc);

create index if not exists idx_ride_audit_log_driver_id
  on public.ride_audit_log (driver_id);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_driver_preferences_updated_at on public.driver_preferences;
create trigger trg_driver_preferences_updated_at
before update on public.driver_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists trg_trip_groups_updated_at on public.trip_groups;
create trigger trg_trip_groups_updated_at
before update on public.trip_groups
for each row
execute function public.set_updated_at();

drop trigger if exists trg_trip_occurrences_updated_at on public.trip_occurrences;
create trigger trg_trip_occurrences_updated_at
before update on public.trip_occurrences
for each row
execute function public.set_updated_at();

drop trigger if exists trg_trip_legs_updated_at on public.trip_legs;
create trigger trg_trip_legs_updated_at
before update on public.trip_legs
for each row
execute function public.set_updated_at();

drop trigger if exists trg_trip_occurrences_status_fields on public.trip_occurrences;
create trigger trg_trip_occurrences_status_fields
before insert or update on public.trip_occurrences
for each row
execute function public.sync_trip_occurrence_status_fields();

create or replace function public.audit_trip_groups()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _driver_id uuid;
  _trip_group_id uuid;
  _action text;
begin
  if tg_op = 'DELETE' then
    _driver_id := old.driver_id;
    _trip_group_id := old.id;
  else
    _driver_id := new.driver_id;
    _trip_group_id := new.id;
  end if;

  _action := case
    when tg_op = 'INSERT' then 'insert'
    when tg_op = 'DELETE' then 'delete'
    else 'update'
  end;

  insert into public.ride_audit_log (
    trip_group_id,
    driver_id,
    entity_type,
    action,
    old_data,
    new_data
  )
  values (
    _trip_group_id,
    _driver_id,
    'trip_group',
    _action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.audit_trip_occurrences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _driver_id uuid;
  _trip_group_id uuid;
  _action text;
begin
  _trip_group_id := coalesce(new.trip_group_id, old.trip_group_id);

  select driver_id
  into _driver_id
  from public.trip_groups
  where id = _trip_group_id;

  if tg_op = 'INSERT' then
    _action := 'insert';
  elsif tg_op = 'DELETE' then
    _action := 'delete';
  elsif new.status is distinct from old.status then
    _action := case
      when new.status = 'completed' then 'completed'
      when new.status = 'canceled_paid' then 'paid_cancel'
      else 'status_changed'
    end;
  else
    _action := 'update';
  end if;

  insert into public.ride_audit_log (
    trip_group_id,
    trip_occurrence_id,
    driver_id,
    entity_type,
    action,
    old_data,
    new_data
  )
  values (
    _trip_group_id,
    coalesce(new.id, old.id),
    _driver_id,
    'trip_occurrence',
    _action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create or replace function public.audit_trip_legs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _occurrence_id uuid;
  _trip_group_id uuid;
  _driver_id uuid;
  _action text;
begin
  _occurrence_id := coalesce(new.trip_occurrence_id, old.trip_occurrence_id);

  select o.trip_group_id, g.driver_id
  into _trip_group_id, _driver_id
  from public.trip_occurrences o
  join public.trip_groups g on g.id = o.trip_group_id
  where o.id = _occurrence_id;

  if tg_op = 'INSERT' then
    _action := 'insert';
  elsif tg_op = 'DELETE' then
    _action := 'delete';
  elsif new.status is distinct from old.status then
    _action := 'status_changed';
  else
    _action := 'update';
  end if;

  insert into public.ride_audit_log (
    trip_group_id,
    trip_occurrence_id,
    trip_leg_id,
    driver_id,
    entity_type,
    action,
    old_data,
    new_data
  )
  values (
    _trip_group_id,
    _occurrence_id,
    coalesce(new.id, old.id),
    _driver_id,
    'trip_leg',
    _action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_audit_trip_groups on public.trip_groups;
create trigger trg_audit_trip_groups
after insert or update or delete on public.trip_groups
for each row
execute function public.audit_trip_groups();

drop trigger if exists trg_audit_trip_occurrences on public.trip_occurrences;
create trigger trg_audit_trip_occurrences
after insert or update or delete on public.trip_occurrences
for each row
execute function public.audit_trip_occurrences();

drop trigger if exists trg_audit_trip_legs on public.trip_legs;
create trigger trg_audit_trip_legs
after insert or update or delete on public.trip_legs
for each row
execute function public.audit_trip_legs();

alter table public.profiles enable row level security;
alter table public.driver_preferences enable row level security;
alter table public.trip_groups enable row level security;
alter table public.trip_occurrences enable row level security;
alter table public.trip_legs enable row level security;
alter table public.ride_audit_log enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "Users can manage their own preferences" on public.driver_preferences;
create policy "Users can manage their own preferences"
on public.driver_preferences
for all
using (auth.uid() = driver_id)
with check (auth.uid() = driver_id);

drop policy if exists "Users can manage their own trip groups" on public.trip_groups;
create policy "Users can manage their own trip groups"
on public.trip_groups
for all
using (auth.uid() = driver_id)
with check (auth.uid() = driver_id);

drop policy if exists "Users can manage occurrences for their trip groups" on public.trip_occurrences;
create policy "Users can manage occurrences for their trip groups"
on public.trip_occurrences
for all
using (
  exists (
    select 1
    from public.trip_groups g
    where g.id = trip_occurrences.trip_group_id
      and g.driver_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trip_groups g
    where g.id = trip_occurrences.trip_group_id
      and g.driver_id = auth.uid()
  )
);

drop policy if exists "Users can manage legs for their trip occurrences" on public.trip_legs;
create policy "Users can manage legs for their trip occurrences"
on public.trip_legs
for all
using (
  exists (
    select 1
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where o.id = trip_legs.trip_occurrence_id
      and g.driver_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.trip_occurrences o
    join public.trip_groups g on g.id = o.trip_group_id
    where o.id = trip_legs.trip_occurrence_id
      and g.driver_id = auth.uid()
  )
);

drop policy if exists "Users can read their own ride audit log" on public.ride_audit_log;
create policy "Users can read their own ride audit log"
on public.ride_audit_log
for select
using (auth.uid() = driver_id);

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
  if current_setting('app.account_deletion', true) = 'on' then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    _driver_id := old.driver_id;
    _trip_group_id := null;
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
  _trip_occurrence_id uuid;
  _action text;
begin
  if current_setting('app.account_deletion', true) = 'on' then
    return coalesce(new, old);
  end if;

  _trip_group_id := coalesce(new.trip_group_id, old.trip_group_id);

  select driver_id
  into _driver_id
  from public.trip_groups
  where id = _trip_group_id;

  if tg_op = 'INSERT' then
    _action := 'insert';
    _trip_occurrence_id := new.id;
  elsif tg_op = 'DELETE' then
    _action := 'delete';
    _trip_group_id := null;
    _trip_occurrence_id := null;
  elsif new.status is distinct from old.status then
    _action := case
      when new.status = 'completed' then 'completed'
      when new.status = 'canceled_paid' then 'paid_cancel'
      else 'status_changed'
    end;
    _trip_occurrence_id := new.id;
  else
    _action := 'update';
    _trip_occurrence_id := new.id;
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
    _trip_occurrence_id,
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
  _trip_leg_id uuid;
  _action text;
begin
  if current_setting('app.account_deletion', true) = 'on' then
    return coalesce(new, old);
  end if;

  _occurrence_id := coalesce(new.trip_occurrence_id, old.trip_occurrence_id);

  select o.trip_group_id, g.driver_id
  into _trip_group_id, _driver_id
  from public.trip_occurrences o
  join public.trip_groups g on g.id = o.trip_group_id
  where o.id = _occurrence_id;

  if tg_op = 'INSERT' then
    _action := 'insert';
    _trip_leg_id := new.id;
  elsif tg_op = 'DELETE' then
    _action := 'delete';
    _occurrence_id := null;
    _trip_group_id := null;
    _trip_leg_id := null;
  elsif new.status is distinct from old.status then
    _action := 'status_changed';
    _trip_leg_id := new.id;
  else
    _action := 'update';
    _trip_leg_id := new.id;
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
    _trip_leg_id,
    _driver_id,
    'trip_leg',
    _action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

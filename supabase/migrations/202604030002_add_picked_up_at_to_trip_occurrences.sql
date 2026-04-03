alter table public.trip_occurrences
  add column if not exists picked_up_at timestamptz;

create or replace function public.sync_trip_occurrence_status_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.status_changed_at = coalesce(new.status_changed_at, timezone('utc', now()));

    if new.status = 'in_progress' and new.picked_up_at is null then
      new.picked_up_at = timezone('utc', now());
    end if;

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

    if new.status = 'in_progress' and old.status is distinct from 'in_progress' then
      new.picked_up_at = coalesce(new.picked_up_at, timezone('utc', now()));
    end if;

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

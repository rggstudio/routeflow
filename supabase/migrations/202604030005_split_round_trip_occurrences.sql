create temporary table tmp_round_trip_split_map on commit drop as
select
  o.id as occurrence_id,
  gen_random_uuid() as new_occurrence_id,
  o.trip_group_id,
  o.service_date,
  o.status,
  ((floor(round(coalesce(o.override_pay_amount, g.pay_amount) * 100)::numeric / 2.0)) / 100.0)::numeric(10, 2) as outbound_pay,
  ((round(coalesce(o.override_pay_amount, g.pay_amount) * 100)::bigint - floor(round(coalesce(o.override_pay_amount, g.pay_amount) * 100)::numeric / 2.0)) / 100.0)::numeric(10, 2) as return_pay,
  o.status_changed_at,
  o.completed_at,
  o.canceled_at,
  o.cancellation_reason,
  o.verification_note,
  o.verification_meta,
  o.created_at,
  o.updated_at,
  return_leg.id as return_leg_id
from public.trip_occurrences o
join public.trip_groups g on g.id = o.trip_group_id
join lateral (
  select l.id
  from public.trip_legs l
  where l.trip_occurrence_id = o.id
    and l.leg_type = 'return'
  limit 1
) as return_leg on true
where exists (
  select 1
  from public.trip_legs l
  where l.trip_occurrence_id = o.id
    and l.leg_type = 'outbound'
);

insert into public.trip_occurrences (
  id,
  trip_group_id,
  service_date,
  status,
  override_pay_amount,
  status_changed_at,
  completed_at,
  canceled_at,
  cancellation_reason,
  verification_note,
  verification_meta,
  created_at,
  updated_at
)
select
  new_occurrence_id,
  trip_group_id,
  service_date,
  status,
  return_pay,
  status_changed_at,
  completed_at,
  canceled_at,
  cancellation_reason,
  verification_note,
  verification_meta,
  created_at,
  updated_at
from tmp_round_trip_split_map;

update public.trip_occurrences o
set override_pay_amount = m.outbound_pay
from tmp_round_trip_split_map m
where o.id = m.occurrence_id;

update public.trip_legs l
set trip_occurrence_id = m.new_occurrence_id
from tmp_round_trip_split_map m
where l.id = m.return_leg_id;

drop function if exists public.delete_current_user_account();

create or replace function public.delete_current_user_account()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _user_id uuid := auth.uid();
begin
  if _user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from auth.users
  where id = _user_id;

  return jsonb_build_object('deleted', true);
end;
$$;

revoke all on function public.delete_current_user_account() from public;
grant execute on function public.delete_current_user_account() to authenticated;

notify pgrst, 'reload schema';

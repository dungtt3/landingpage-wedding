-- /admin: delete a guest, and read the RSVPs (closed to the public key since the start).

create or replace function public.admin_delete_guest(p_key text, p_code text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  deleted int;
begin
  perform admin_require(p_key);
  delete from guests g where g.code = p_code;
  get diagnostics deleted = row_count;
  return deleted > 0;
end;
$$;

create or replace function public.admin_list_rsvps(p_key text)
returns table (id uuid, created_at timestamptz, name text, attending text, side text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform admin_require(p_key);
  return query select r.id, r.created_at, r.name, r.attending, r.side from rsvps r order by r.created_at desc;
end;
$$;

revoke all on function public.admin_delete_guest(text, text) from public;
revoke all on function public.admin_list_rsvps(text) from public;
grant execute on function public.admin_delete_guest(text, text) to anon, authenticated;
grant execute on function public.admin_list_rsvps(text) to anon, authenticated;

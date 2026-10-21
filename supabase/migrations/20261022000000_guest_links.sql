-- Short invitation links: /g/<code> → the guest's name and party (place).
-- Run once in Supabase → SQL Editor → New query → Run.
-- The table is closed to the public key; the site only goes through two functions:
--   create_guest(name, place) → a new 6-letter code (used by /admin)
--   guest_by_code(code)       → that one guest's name + place (no way to list them all)

create table if not exists public.guests (
  code        text primary key check (code ~ '^[a-z0-9]{6}$'),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 60),
  place       int  not null check (place between 1 and 9)
);

alter table public.guests enable row level security;
revoke all on public.guests from anon, authenticated;

create or replace function public.create_guest(p_name text, p_place int)
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  -- No 0/o, 1/l/i: codes stay readable if someone types one out.
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  new_code text;
begin
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into guests (code, name, place) values (new_code, p_name, p_place);
      return new_code;
    exception when unique_violation then
      -- Taken already: draw another.
    end;
  end loop;
end;
$$;

create or replace function public.guest_by_code(p_code text)
returns table (name text, place int)
language sql
stable
security definer
set search_path = public
as $$
  select g.name, g.place from guests g where g.code = lower(btrim(p_code));
$$;

revoke all on function public.create_guest(text, int) from public;
revoke all on function public.guest_by_code(text) from public;
grant execute on function public.create_guest(text, int) to anon, authenticated;
grant execute on function public.guest_by_code(text) to anon, authenticated;

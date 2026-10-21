-- /admin with a password: list, edit and bulk-import guests.
-- Every admin function takes the password (`p_key`) and checks it against a
-- bcrypt hash in `admin_settings`. The first visit to /admin sets it
-- (`admin_set_key` only works while none is set). Forgot it? Run
--   delete from public.admin_settings;
-- in the SQL Editor and open /admin again to choose a new one.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_settings (
  id        int primary key default 1 check (id = 1),
  key_hash  text not null
);

alter table public.admin_settings enable row level security;
revoke all on public.admin_settings from anon, authenticated;

-- Internal helpers (not callable with the public key).

create or replace function public.admin_key_ok(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (select 1 from admin_settings s where s.key_hash = crypt(coalesce(p_key, ''), s.key_hash));
$$;

create or replace function public.admin_require(p_key text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not admin_key_ok(p_key) then
    raise exception 'invalid admin key' using errcode = '28P01';
  end if;
end;
$$;

create or replace function public.guest_tidy_name(p_name text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
$$;

/** Inserts one guest under a fresh random code and returns the code. */
create or replace function public.guest_insert(p_name text, p_place int)
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
  loop
    new_code := '';
    for i in 1..6 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    begin
      insert into guests (code, name, place) values (new_code, guest_tidy_name(p_name), p_place);
      return new_code;
    exception when unique_violation then
      -- Taken already: draw another.
    end;
  end loop;
end;
$$;

-- Public: what /admin needs before anyone has signed in.

create or replace function public.admin_has_key()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_settings);
$$;

create or replace function public.admin_set_key(p_new text)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  if char_length(coalesce(p_new, '')) < 8 then
    raise exception 'admin key too short' using errcode = '22023';
  end if;
  -- Only the very first time: id = 1 is the only row allowed.
  insert into admin_settings (id, key_hash) values (1, crypt(p_new, gen_salt('bf')));
exception when unique_violation then
  raise exception 'admin key already set' using errcode = '42501';
end;
$$;

create or replace function public.admin_login(p_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select admin_key_ok(p_key);
$$;

-- Admin: all guarded by the password.

drop function if exists public.create_guest(text, int);

create or replace function public.admin_list_guests(p_key text)
returns table (code text, name text, place int, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform admin_require(p_key);
  return query select g.code, g.name, g.place, g.created_at from guests g order by g.created_at desc, g.code;
end;
$$;

/** Adds guests from a JSON array of {name, place}; returns the new rows. */
create or replace function public.admin_add_guests(p_key text, p_guests jsonb)
returns table (code text, name text, place int, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  item jsonb;
  new_code text;
begin
  perform admin_require(p_key);
  if jsonb_typeof(p_guests) <> 'array' or jsonb_array_length(p_guests) > 2000 then
    raise exception 'expected an array of at most 2000 guests' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(p_guests) loop
    new_code := guest_insert(item ->> 'name', (item ->> 'place')::int);
    return query select g.code, g.name, g.place, g.created_at from guests g where g.code = new_code;
  end loop;
end;
$$;

create or replace function public.admin_update_guest(p_key text, p_code text, p_name text, p_place int)
returns table (code text, name text, place int, created_at timestamptz)
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  perform admin_require(p_key);
  return query
    update guests g set name = guest_tidy_name(p_name), place = p_place
    where g.code = p_code
    returning g.code, g.name, g.place, g.created_at;
end;
$$;

revoke all on function public.admin_key_ok(text) from public, anon, authenticated;
revoke all on function public.admin_require(text) from public, anon, authenticated;
revoke all on function public.guest_tidy_name(text) from public, anon, authenticated;
revoke all on function public.guest_insert(text, int) from public, anon, authenticated;
revoke all on function public.admin_has_key() from public;
revoke all on function public.admin_set_key(text) from public;
revoke all on function public.admin_login(text) from public;
revoke all on function public.admin_list_guests(text) from public;
revoke all on function public.admin_add_guests(text, jsonb) from public;
revoke all on function public.admin_update_guest(text, text, text, int) from public;
grant execute on function public.admin_has_key() to anon, authenticated;
grant execute on function public.admin_set_key(text) to anon, authenticated;
grant execute on function public.admin_login(text) to anon, authenticated;
grant execute on function public.admin_list_guests(text) to anon, authenticated;
grant execute on function public.admin_add_guests(text, jsonb) to anon, authenticated;
grant execute on function public.admin_update_guest(text, text, text, int) to anon, authenticated;

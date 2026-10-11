-- Wedding site backend. Run once in Supabase → SQL Editor → New query → Run.
-- The site talks to these tables with the public (anon / publishable) key, so
-- Row Level Security decides what a guest may do:
--   rsvps  : guests can only INSERT. Nobody can read them with the public key
--            (names + phone numbers); read them in the Table Editor.
--   wishes : guests can INSERT and read the visible ones. Hide a wish by
--            setting `hidden = true` in the Table Editor.

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 80),
  phone       text not null default '' check (char_length(phone) <= 30),
  attending   text not null check (attending in ('yes', 'no')),
  guests      int  not null default 1 check (guests between 0 and 20),
  side        text not null check (side in ('groom', 'bride', 'both')),
  message     text not null default '' check (char_length(message) <= 1000)
);

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 1 and 60),
  message     text not null check (char_length(message) between 1 and 500),
  side        text check (side in ('groom', 'bride')),
  hidden      boolean not null default false
);

create index if not exists wishes_created_at_idx on public.wishes (created_at desc);

alter table public.rsvps  enable row level security;
alter table public.wishes enable row level security;

drop policy if exists "guests send rsvp" on public.rsvps;
create policy "guests send rsvp" on public.rsvps
  for insert to anon, authenticated with check (true);

drop policy if exists "guests add wishes" on public.wishes;
create policy "guests add wishes" on public.wishes
  for insert to anon, authenticated with check (hidden = false);

drop policy if exists "guests read visible wishes" on public.wishes;
create policy "guests read visible wishes" on public.wishes
  for select to anon, authenticated using (hidden = false);

-- Column-level: guests cannot set `hidden` (it stays false), only an admin can.
revoke all on public.rsvps from anon, authenticated;
revoke all on public.wishes from anon, authenticated;
grant insert (name, phone, attending, guests, side, message) on public.rsvps to anon, authenticated;
grant insert (name, message, side) on public.wishes to anon, authenticated;
grant select (id, created_at, name, message, side, hidden) on public.wishes to anon, authenticated;

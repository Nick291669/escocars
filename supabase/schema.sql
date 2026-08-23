-- ESCO Anhängervermietung: Accounts + Buchungen
-- Dieses Skript einmal im Supabase SQL Editor ausführen.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trailer_id text not null,
  trailer_title text not null,
  start_date date not null,
  end_date date not null,
  days integer not null check (days > 0),
  price_per_day numeric(10,2),
  total_price numeric(10,2),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_date_order check (end_date >= start_date)
);

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

-- Policies idempotent neu anlegen
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_insert_own" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "bookings_select_own" on public.bookings for select using (auth.uid() = user_id);
create policy "bookings_insert_own" on public.bookings for insert with check (auth.uid() = user_id);
create policy "bookings_update_own" on public.bookings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Accountprofil automatisch beim Registrieren erzeugen.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Buchung atomar anlegen und Doppelbuchungen verhindern.
create or replace function public.create_booking(
  p_trailer_id text,
  p_trailer_title text,
  p_start_date date,
  p_end_date date,
  p_days integer,
  p_price_per_day numeric,
  p_total_price numeric,
  p_note text default ''
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_booking_id uuid;
begin
  if v_user is null then
    raise exception 'Nicht angemeldet';
  end if;

  if p_end_date < p_start_date then
    raise exception 'Ungültiger Mietzeitraum';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.trailer_id = p_trailer_id
      and b.status in ('pending', 'confirmed')
      and daterange(b.start_date, b.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Dieser Anhänger ist im ausgewählten Zeitraum bereits reserviert.';
  end if;

  insert into public.bookings (
    user_id, trailer_id, trailer_title, start_date, end_date, days,
    price_per_day, total_price, status, note
  ) values (
    v_user, p_trailer_id, p_trailer_title, p_start_date, p_end_date, p_days,
    p_price_per_day, p_total_price, 'pending', coalesce(p_note, '')
  ) returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.create_booking(text,text,date,date,integer,numeric,numeric,text) to authenticated;

-- ESCO: Zahlungsart + Adminbereich
create extension if not exists pgcrypto;

alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.bookings add column if not exists payment_method text not null default 'cash';

update public.profiles p
set email = coalesce(u.email, '')
from auth.users u
where u.id = p.id and (p.email is null or p.email = '');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id and is_admin = true
  );
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.is_admin(auth.uid()); $$;

grant execute on function public.is_current_user_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "bookings_select_admin" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;

create policy "profiles_select_admin"
on public.profiles for select
using (public.is_admin());

create policy "bookings_select_admin"
on public.bookings for select
using (public.is_admin());

drop function if exists public.create_booking(text,text,date,date,integer,numeric,numeric,text);
drop function if exists public.create_booking(text,text,date,date,integer,numeric,numeric,time);
drop function if exists public.create_booking(text,text,date,date,integer,numeric,numeric,time,text);

create or replace function public.create_booking(
  p_trailer_id text,
  p_trailer_title text,
  p_start_date date,
  p_end_date date,
  p_days integer,
  p_price_per_day numeric,
  p_total_price numeric,
  p_pickup_time time,
  p_payment_method text
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_booking_id uuid;
begin
  if v_user is null then raise exception 'Nicht angemeldet'; end if;
  if p_end_date < p_start_date then raise exception 'Ungültiger Mietzeitraum'; end if;
  if p_pickup_time is null then raise exception 'Bitte eine Abholzeit auswählen'; end if;
  if p_payment_method not in ('cash','online') then raise exception 'Ungültige Zahlungsart'; end if;

  if exists (
    select 1 from public.bookings b
    where b.trailer_id = p_trailer_id
      and b.status in ('pending','confirmed')
      and daterange(b.start_date,b.end_date,'[]') && daterange(p_start_date,p_end_date,'[]')
  ) then
    raise exception 'Dieser Anhänger ist im ausgewählten Zeitraum bereits reserviert.';
  end if;

  insert into public.bookings (
    user_id,trailer_id,trailer_title,start_date,end_date,pickup_time,days,
    price_per_day,total_price,payment_method,status,note
  ) values (
    v_user,p_trailer_id,p_trailer_title,p_start_date,p_end_date,p_pickup_time,p_days,
    p_price_per_day,p_total_price,p_payment_method,'pending',''
  ) returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.create_booking(text,text,date,date,integer,numeric,numeric,time,text) to authenticated;

create or replace function public.cancel_own_booking(p_booking_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  update public.bookings
  set status='cancelled', updated_at=now()
  where id=p_booking_id and user_id=auth.uid() and status='pending';
  if not found then raise exception 'Diese Buchung kann nicht storniert werden.'; end if;
end;
$$;

grant execute on function public.cancel_own_booking(uuid) to authenticated;

create or replace function public.admin_set_booking_status(p_booking_id uuid,p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  if p_status not in ('pending','confirmed','cancelled','completed') then raise exception 'Ungültiger Status'; end if;

  update public.bookings
  set status=p_status, updated_at=now()
  where id=p_booking_id;

  if not found then raise exception 'Buchung nicht gefunden'; end if;
end;
$$;

grant execute on function public.admin_set_booking_status(uuid,text) to authenticated;

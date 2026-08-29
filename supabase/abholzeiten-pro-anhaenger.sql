-- LIWA – Abholzeiten je Anhänger + optionaler Uhrzeitwunsch
-- Einmal vollständig im Supabase SQL Editor ausführen.

create table if not exists public.trailer_pickup_settings (
  trailer_id text primary key,
  available_times text[] not null default array[
    '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'
  ]::text[],
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.trailer_pickup_settings enable row level security;

drop policy if exists "pickup_settings_public_read" on public.trailer_pickup_settings;
create policy "pickup_settings_public_read"
on public.trailer_pickup_settings
for select
using (true);

drop policy if exists "pickup_settings_admin_insert" on public.trailer_pickup_settings;
create policy "pickup_settings_admin_insert"
on public.trailer_pickup_settings
for insert
with check (public.is_admin());

drop policy if exists "pickup_settings_admin_update" on public.trailer_pickup_settings;
create policy "pickup_settings_admin_update"
on public.trailer_pickup_settings
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "pickup_settings_admin_delete" on public.trailer_pickup_settings;
create policy "pickup_settings_admin_delete"
on public.trailer_pickup_settings
for delete
using (public.is_admin());

grant select on public.trailer_pickup_settings to anon, authenticated;
grant insert, update, delete on public.trailer_pickup_settings to authenticated;

alter table public.bookings
add column if not exists pickup_time_wish text;

drop function if exists public.create_booking(
  text,text,date,date,integer,numeric,numeric,time,text
);

drop function if exists public.create_booking(
  text,text,date,date,integer,numeric,numeric,time,text,text
);

create or replace function public.create_booking(
  p_trailer_id text,
  p_trailer_title text,
  p_start_date date,
  p_end_date date,
  p_days integer,
  p_price_per_day numeric,
  p_total_price numeric,
  p_pickup_time time,
  p_pickup_time_wish text,
  p_payment_method text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_booking_id uuid;
  v_allowed_times text[];
  v_pickup_label text;
begin
  if v_user is null then
    raise exception 'Nicht angemeldet';
  end if;

  if p_end_date < p_start_date then
    raise exception 'Ungültiger Mietzeitraum';
  end if;

  if p_pickup_time is null then
    raise exception 'Bitte eine Abholzeit auswählen';
  end if;

  if p_payment_method not in ('cash','online') then
    raise exception 'Ungültige Zahlungsart';
  end if;

  select s.available_times
  into v_allowed_times
  from public.trailer_pickup_settings s
  where s.trailer_id = p_trailer_id;

  if v_allowed_times is null then
    v_allowed_times := array[
      '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'
    ]::text[];
  end if;

  v_pickup_label := to_char(p_pickup_time, 'HH24:MI');

  if not (v_pickup_label = any(v_allowed_times)) then
    raise exception 'Diese Abholzeit ist für den ausgewählten Anhänger nicht verfügbar.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.trailer_id = p_trailer_id
      and b.status in ('pending','confirmed')
      and b.deleted_at is null
      and daterange(b.start_date,b.end_date,'[]')
        && daterange(p_start_date,p_end_date,'[]')
  ) then
    raise exception 'Dieser Anhänger ist im ausgewählten Zeitraum bereits reserviert.';
  end if;

  insert into public.bookings (
    user_id,
    trailer_id,
    trailer_title,
    start_date,
    end_date,
    pickup_time,
    pickup_time_wish,
    days,
    price_per_day,
    total_price,
    payment_method,
    status,
    note
  )
  values (
    v_user,
    p_trailer_id,
    p_trailer_title,
    p_start_date,
    p_end_date,
    p_pickup_time,
    nullif(trim(p_pickup_time_wish), ''),
    p_days,
    p_price_per_day,
    p_total_price,
    p_payment_method,
    'pending',
    ''
  )
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

grant execute on function public.create_booking(
  text,text,date,date,integer,numeric,numeric,time,text,text
) to authenticated;

-- ESCO: Verfügbarkeitskalender
-- Dieses Skript NACH deinem bisherigen schema.sql im Supabase SQL Editor ausführen.
--
-- Es verändert keine bestehenden Buchungen. Es ergänzt nur zwei lesbare
-- Verfügbarkeitsfunktionen für den Kalender und die Anhängerauswahl.

create or replace function public.get_unavailable_trailer_ids(
  p_start_date date,
  p_end_date date
)
returns table(trailer_id text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct b.trailer_id
  from public.bookings b
  where b.status in ('pending', 'confirmed')
    and daterange(b.start_date, b.end_date, '[]')
        && daterange(p_start_date, p_end_date, '[]');
$$;

grant execute on function public.get_unavailable_trailer_ids(date,date) to anon, authenticated;


create or replace function public.get_trailer_booked_dates(
  p_trailer_id text,
  p_from_date date,
  p_to_date date
)
returns table(booked_date date)
language sql
stable
security definer
set search_path = public
as $$
  select distinct gs::date as booked_date
  from public.bookings b
  cross join lateral generate_series(
    greatest(b.start_date, p_from_date)::timestamp,
    least(b.end_date, p_to_date)::timestamp,
    interval '1 day'
  ) gs
  where b.trailer_id = p_trailer_id
    and b.status in ('pending', 'confirmed')
    and b.end_date >= p_from_date
    and b.start_date <= p_to_date
  order by booked_date;
$$;

grant execute on function public.get_trailer_booked_dates(text,date,date) to anon, authenticated;

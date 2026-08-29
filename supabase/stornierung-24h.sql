-- LIWA: Kundenstornierung bis 24 Stunden vor Mietbeginn
-- Einmal im Supabase SQL Editor ausführen.

create or replace function public.cancel_own_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_start timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
    and user_id = auth.uid()
    and status in ('pending', 'confirmed');

  if not found then
    raise exception 'Diese Buchung kann nicht storniert werden.';
  end if;

  -- Mietbeginn in deutscher Ortszeit berechnen.
  v_start :=
    (v_booking.start_date + coalesce(v_booking.pickup_time, time '00:00'))
    at time zone 'Europe/Berlin';

  if v_start - now() < interval '24 hours' then
    raise exception 'Eine Selbststornierung ist nur bis 24 Stunden vor Mietbeginn möglich. Bitte kontaktiere uns telefonisch unter 01517 0387967.';
  end if;

  update public.bookings
  set status = 'cancelled',
      updated_at = now()
  where id = p_booking_id
    and user_id = auth.uid();
end;
$$;

grant execute on function public.cancel_own_booking(uuid) to authenticated;

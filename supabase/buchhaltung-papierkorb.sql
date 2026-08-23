-- LIWA Buchhaltung – Papierkorb / Wiederherstellen
-- Einmal NACH deinen bisherigen Buchhaltungs-SQL-Dateien ausführen.

alter table public.bookings add column if not exists deleted_at timestamptz;
alter table public.bookings add column if not exists deleted_by uuid references auth.users(id);
alter table public.bookings add column if not exists trash_reason text not null default '';
alter table public.bookings add column if not exists trash_previous_status text;
alter table public.bookings add column if not exists trash_previous_payment_status text;

alter table public.accounting_entries add column if not exists deleted_at timestamptz;
alter table public.accounting_entries add column if not exists deleted_by uuid references auth.users(id);

alter table public.security_deposits add column if not exists deleted_at timestamptz;
alter table public.security_deposits add column if not exists deleted_by uuid references auth.users(id);

drop index if exists public.accounting_one_rental_payment_per_booking;
create unique index if not exists accounting_one_rental_payment_per_booking
on public.accounting_entries (booking_id)
where entry_type = 'rental_income'
  and correction_of is null
  and deleted_at is null;

create or replace function public.admin_move_booking_to_trash(
  p_booking_id uuid,
  p_reason text default 'Storniert'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;

  select * into v_booking from public.bookings
  where id = p_booking_id and deleted_at is null;
  if not found then raise exception 'Buchung nicht gefunden oder bereits im Papierkorb'; end if;

  update public.bookings
  set trash_previous_status = status,
      trash_previous_payment_status = payment_status,
      trash_reason = coalesce(trim(p_reason), 'Storniert'),
      deleted_at = now(),
      deleted_by = auth.uid(),
      status = 'cancelled',
      payment_status = 'unpaid',
      paid_at = null,
      updated_at = now()
  where id = p_booking_id;

  update public.accounting_entries
  set deleted_at = now(), deleted_by = auth.uid()
  where booking_id = p_booking_id and deleted_at is null;

  update public.security_deposits
  set deleted_at = now(), deleted_by = auth.uid()
  where booking_id = p_booking_id and deleted_at is null;
end;
$$;

grant execute on function public.admin_move_booking_to_trash(uuid,text) to authenticated;

create or replace function public.admin_move_accounting_entry_to_trash(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.accounting_entries%rowtype;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;

  select * into v_entry from public.accounting_entries
  where id = p_entry_id and deleted_at is null;
  if not found then raise exception 'Kassenbucheintrag nicht gefunden'; end if;

  if v_entry.booking_id is not null and v_entry.entry_type = 'rental_income' then
    perform public.admin_move_booking_to_trash(v_entry.booking_id, 'Aus Kassenbuch entfernt');
    return;
  end if;

  update public.accounting_entries
  set deleted_at = now(), deleted_by = auth.uid()
  where id = p_entry_id;
end;
$$;

grant execute on function public.admin_move_accounting_entry_to_trash(uuid) to authenticated;

create or replace function public.admin_restore_booking_from_trash(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;

  update public.bookings
  set deleted_at = null,
      deleted_by = null,
      trash_reason = '',
      status = 'confirmed',
      payment_status = 'unpaid',
      paid_at = null,
      stripe_checkout_session_id = null,
      stripe_payment_intent_id = null,
      updated_at = now()
  where id = p_booking_id and deleted_at is not null;

  if not found then raise exception 'Anfrage nicht im Papierkorb gefunden'; end if;

  update public.security_deposits
  set deleted_at = null, deleted_by = null
  where booking_id = p_booking_id;
end;
$$;

grant execute on function public.admin_restore_booking_from_trash(uuid) to authenticated;

create or replace function public.admin_restore_accounting_entry_from_trash(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;

  update public.accounting_entries
  set deleted_at = null, deleted_by = null
  where id = p_entry_id
    and deleted_at is not null
    and booking_id is null;

  if not found then raise exception 'Kassenbucheintrag konnte nicht wiederhergestellt werden'; end if;
end;
$$;

grant execute on function public.admin_restore_accounting_entry_from_trash(uuid) to authenticated;

-- Bar-/Onlinezahlungen dürfen gelöschte alte Einnahmen ignorieren.
create or replace function public.admin_record_cash_rental_payment(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_profile public.profiles%rowtype;
  v_id uuid;
  v_receipt text;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  select * into v_booking from public.bookings where id = p_booking_id and deleted_at is null;
  if not found then raise exception 'Buchung nicht gefunden'; end if;
  if v_booking.total_price is null or v_booking.total_price <= 0 then raise exception 'Ungültiger Preis'; end if;

  select * into v_profile from public.profiles where id = v_booking.user_id;
  v_receipt := public.next_accounting_receipt(current_date);

  insert into public.accounting_entries(
    receipt_number, booking_id, entry_date, entry_type, amount,
    description, counterparty, payment_method, reference, created_by
  ) values (
    v_receipt, p_booking_id, current_date, 'rental_income', v_booking.total_price,
    'Barzahlung Miete – ' || v_booking.trailer_title,
    coalesce(v_profile.full_name, ''),
    'cash',
    'Buchung ' || upper(left(v_booking.id::text, 8)),
    auth.uid()
  ) returning id into v_id;

  update public.bookings
  set payment_status='paid_cash', paid_at=now(), updated_at=now()
  where id=p_booking_id;

  return v_id;
end;
$$;
grant execute on function public.admin_record_cash_rental_payment(uuid) to authenticated;

create or replace function public.admin_record_online_rental_payment(p_booking_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_profile public.profiles%rowtype;
  v_id uuid;
  v_receipt text;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  select * into v_booking from public.bookings where id = p_booking_id and deleted_at is null;
  if not found then raise exception 'Buchung nicht gefunden'; end if;
  if v_booking.total_price is null or v_booking.total_price <= 0 then raise exception 'Ungültiger Preis'; end if;

  select * into v_profile from public.profiles where id = v_booking.user_id;
  v_receipt := public.next_accounting_receipt(current_date);

  insert into public.accounting_entries(
    receipt_number, booking_id, entry_date, entry_type, amount,
    description, counterparty, payment_method, reference, created_by
  ) values (
    v_receipt, p_booking_id, current_date, 'rental_income', v_booking.total_price,
    'Onlinezahlung Miete – ' || v_booking.trailer_title,
    coalesce(v_profile.full_name, ''),
    'online',
    'Buchung ' || upper(left(v_booking.id::text, 8)),
    auth.uid()
  ) returning id into v_id;

  update public.bookings
  set payment_status='paid_online', paid_at=now(), updated_at=now()
  where id=p_booking_id;

  return v_id;
end;
$$;
grant execute on function public.admin_record_online_rental_payment(uuid) to authenticated;

-- LIWA Buchhaltung / Kassenbuch
-- Einmal im Supabase SQL Editor ausführen.
-- Vorher idealerweise ein Datenbank-Backup erstellen.

create extension if not exists pgcrypto;

create table if not exists public.accounting_counters (
  year integer primary key,
  last_number integer not null default 0
);

create table if not exists public.accounting_entries (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  booking_id uuid references public.bookings(id) on delete restrict,
  entry_date date not null default current_date,
  entry_type text not null check (
    entry_type in (
      'rental_income',
      'business_expense',
      'bank_deposit',
      'private_withdrawal',
      'private_contribution',
      'correction'
    )
  ),
  amount numeric(12,2) not null check (amount <> 0),
  description text not null,
  counterparty text not null default '',
  payment_method text not null default 'cash',
  reference text not null default '',
  correction_of uuid references public.accounting_entries(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create unique index if not exists accounting_one_rental_payment_per_booking
on public.accounting_entries (booking_id)
where entry_type = 'rental_income' and correction_of is null;

create index if not exists accounting_entries_date_idx
on public.accounting_entries(entry_date);

create table if not exists public.security_deposits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  received_at timestamptz not null default now(),
  returned_at timestamptz,
  status text not null default 'held' check (status in ('held','returned','retained')),
  note text not null default '',
  created_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create unique index if not exists one_open_deposit_per_booking
on public.security_deposits(booking_id)
where status = 'held';

alter table public.accounting_entries enable row level security;
alter table public.security_deposits enable row level security;
alter table public.accounting_counters enable row level security;

drop policy if exists "accounting_admin_select" on public.accounting_entries;
create policy "accounting_admin_select"
on public.accounting_entries for select
using (public.is_admin());

drop policy if exists "deposits_admin_select" on public.security_deposits;
create policy "deposits_admin_select"
on public.security_deposits for select
using (public.is_admin());

-- Keine direkten INSERT/UPDATE/DELETE Policies:
-- Änderungen laufen nur über die folgenden Security-Definer-Funktionen.

create or replace function public.next_accounting_receipt(p_date date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer := extract(year from p_date)::integer;
  v_number integer;
begin
  insert into public.accounting_counters(year, last_number)
  values (v_year, 1)
  on conflict (year)
  do update set last_number = public.accounting_counters.last_number + 1
  returning last_number into v_number;

  return 'LIWA-KASSE-' || v_year::text || '-' || lpad(v_number::text, 6, '0');
end;
$$;

revoke all on function public.next_accounting_receipt(date) from public, anon, authenticated;

create or replace function public.admin_add_accounting_entry(
  p_entry_date date,
  p_entry_type text,
  p_amount numeric,
  p_description text,
  p_counterparty text default '',
  p_reference text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_receipt text;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  if p_entry_type not in ('business_expense','bank_deposit','private_withdrawal','private_contribution') then
    raise exception 'Diese Buchungsart kann hier nicht manuell angelegt werden';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Betrag muss größer als 0 sein'; end if;
  if coalesce(trim(p_description),'') = '' then raise exception 'Beschreibung fehlt'; end if;

  v_receipt := public.next_accounting_receipt(p_entry_date);

  insert into public.accounting_entries(
    receipt_number, entry_date, entry_type, amount, description,
    counterparty, reference, payment_method, created_by
  ) values (
    v_receipt, p_entry_date, p_entry_type, p_amount, trim(p_description),
    coalesce(trim(p_counterparty),''), coalesce(trim(p_reference),''),
    'cash', auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_add_accounting_entry(date,text,numeric,text,text,text) to authenticated;

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

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then raise exception 'Buchung nicht gefunden'; end if;
  if v_booking.status not in ('confirmed','completed') then
    raise exception 'Nur bestätigte oder abgeschlossene Buchungen können bezahlt werden';
  end if;
  if v_booking.total_price is null or v_booking.total_price <= 0 then
    raise exception 'Für diese Buchung ist kein gültiger Preis hinterlegt';
  end if;
  if exists (
    select 1 from public.accounting_entries
    where booking_id = p_booking_id
      and entry_type = 'rental_income'
      and correction_of is null
  ) then
    raise exception 'Diese Buchung wurde bereits als bezahlt verbucht';
  end if;

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
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_record_cash_rental_payment(uuid) to authenticated;

create or replace function public.admin_reverse_accounting_entry(
  p_entry_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.accounting_entries%rowtype;
  v_id uuid;
  v_receipt text;
  v_signed_amount numeric;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  if coalesce(trim(p_reason),'') = '' then raise exception 'Korrekturgrund fehlt'; end if;

  select * into v_original from public.accounting_entries where id = p_entry_id;
  if not found then raise exception 'Eintrag nicht gefunden'; end if;
  if v_original.entry_type = 'correction' or v_original.correction_of is not null then
    raise exception 'Korrekturen können nicht erneut korrigiert werden';
  end if;
  if exists (select 1 from public.accounting_entries where correction_of = p_entry_id) then
    raise exception 'Für diesen Eintrag existiert bereits eine Korrektur';
  end if;

  -- Korrektur wirkt genau entgegengesetzt auf den Kassenbestand.
  if v_original.entry_type in ('business_expense','bank_deposit','private_withdrawal') then
    v_signed_amount := v_original.amount;
  else
    v_signed_amount := -v_original.amount;
  end if;

  v_receipt := public.next_accounting_receipt(current_date);

  insert into public.accounting_entries(
    receipt_number, booking_id, entry_date, entry_type, amount,
    description, counterparty, payment_method, reference, correction_of, created_by
  ) values (
    v_receipt, v_original.booking_id, current_date, 'correction', v_signed_amount,
    'Korrektur ' || v_original.receipt_number || ': ' || trim(p_reason),
    v_original.counterparty, v_original.payment_method,
    v_original.receipt_number, v_original.id, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_reverse_accounting_entry(uuid,text) to authenticated;

create or replace function public.admin_receive_security_deposit(
  p_booking_id uuid,
  p_amount numeric,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Kaution muss größer als 0 sein'; end if;
  if not exists (
    select 1 from public.bookings where id = p_booking_id and status in ('confirmed','completed')
  ) then raise exception 'Buchung ist nicht bestätigt'; end if;

  insert into public.security_deposits(booking_id, amount, note, created_by)
  values (p_booking_id, p_amount, coalesce(trim(p_note),''), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_receive_security_deposit(uuid,numeric,text) to authenticated;

create or replace function public.admin_return_security_deposit(p_deposit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'Keine Adminberechtigung'; end if;

  update public.security_deposits
  set status = 'returned', returned_at = now(), updated_at = now()
  where id = p_deposit_id and status = 'held';

  if not found then raise exception 'Kaution nicht gefunden oder bereits abgeschlossen'; end if;
end;
$$;

grant execute on function public.admin_return_security_deposit(uuid) to authenticated;

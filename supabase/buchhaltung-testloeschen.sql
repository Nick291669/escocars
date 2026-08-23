-- LIWA Buchhaltung: Testdaten endgültig löschen
-- NUR für die Entwicklungs-/Testphase gedacht.
-- Einmal NACH `supabase/buchhaltung.sql` im Supabase SQL Editor ausführen.

create or replace function public.admin_delete_accounting_test_entry(p_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entry public.accounting_entries%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Keine Adminberechtigung';
  end if;

  select * into v_entry
  from public.accounting_entries
  where id = p_entry_id;

  if not found then
    raise exception 'Kassenbucheintrag nicht gefunden';
  end if;

  -- Wenn andere Korrekturen auf diesen Datensatz zeigen, zuerst diese Test-Korrekturen löschen.
  delete from public.accounting_entries
  where correction_of = p_entry_id;

  delete from public.accounting_entries
  where id = p_entry_id;
end;
$$;

grant execute on function public.admin_delete_accounting_test_entry(uuid) to authenticated;


create or replace function public.admin_delete_cancelled_test_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Keine Adminberechtigung';
  end if;

  select status into v_status
  from public.bookings
  where id = p_booking_id;

  if not found then
    raise exception 'Buchung nicht gefunden';
  end if;

  if v_status <> 'cancelled' then
    raise exception 'Aus Sicherheitsgründen können hier nur stornierte Testbuchungen gelöscht werden';
  end if;

  -- Nur abhängige Testdaten entfernen, danach die stornierte Buchung.
  delete from public.security_deposits
  where booking_id = p_booking_id;

  -- Erst Korrekturen löschen, dann die ursprünglichen Buchungseinträge.
  delete from public.accounting_entries
  where correction_of in (
    select id from public.accounting_entries where booking_id = p_booking_id
  );

  delete from public.accounting_entries
  where booking_id = p_booking_id;

  delete from public.bookings
  where id = p_booking_id;
end;
$$;

grant execute on function public.admin_delete_cancelled_test_booking(uuid) to authenticated;

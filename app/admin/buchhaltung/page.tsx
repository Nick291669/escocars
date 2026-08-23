'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type EntryType =
  | 'rental_income'
  | 'business_expense'
  | 'bank_deposit'
  | 'private_withdrawal'
  | 'private_contribution'
  | 'correction'

type LedgerEntry = {
  id: string
  receipt_number: string
  booking_id: string | null
  entry_date: string
  entry_type: EntryType
  amount: number
  description: string
  counterparty: string
  payment_method: string
  reference: string
  correction_of: string | null
  created_at: string
}

type Booking = {
  id: string
  trailer_title: string
  start_date: string
  end_date: string
  pickup_time: string | null
  total_price: number | null
  status: string
  user_id: string
}

type Profile = {
  id: string
  full_name: string
  email: string
}

type Deposit = {
  id: string
  booking_id: string
  amount: number
  received_at: string
  returned_at: string | null
  status: 'held' | 'returned' | 'retained'
  note: string
}

const typeLabels: Record<EntryType, string> = {
  rental_income: 'Mieteinnahme',
  business_expense: 'Betriebsausgabe',
  bank_deposit: 'Bankeinzahlung',
  private_withdrawal: 'Privatentnahme',
  private_contribution: 'Privateinlage',
  correction: 'Korrektur',
}

function money(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0)
}

function dateDE(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('de-DE')
}

function todayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export default function BuchhaltungPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [entryType, setEntryType] = useState<EntryType>('business_expense')
  const [entryDate, setEntryDate] = useState(todayISO())
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [reference, setReference] = useState('')
  const [selectedBooking, setSelectedBooking] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositNote, setDepositNote] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      window.location.href = '/login?next=/admin/buchhaltung'
      return
    }

    const { data: allowed, error: adminError } = await supabase.rpc('is_current_user_admin')
    if (adminError || !allowed) {
      setAuthorized(false)
      setError(adminError?.message || 'Keine Adminberechtigung.')
      setLoading(false)
      return
    }
    setAuthorized(true)

    const from = `${year}-01-01`
    const to = `${year}-12-31`

    const [entryResult, bookingResult, profileResult, depositResult, cancelledResult] = await Promise.all([
      supabase
        .from('accounting_entries')
        .select('id,receipt_number,booking_id,entry_date,entry_type,amount,description,counterparty,payment_method,reference,correction_of,created_at')
        .gte('entry_date', from)
        .lte('entry_date', to)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('id,trailer_title,start_date,end_date,pickup_time,total_price,status,user_id')
        .in('status', ['confirmed', 'completed'])
        .order('start_date', { ascending: false }),
      supabase.from('profiles').select('id,full_name,email'),
      supabase
        .from('security_deposits')
        .select('id,booking_id,amount,received_at,returned_at,status,note')
        .order('received_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('id,trailer_title,start_date,end_date,pickup_time,total_price,status,user_id')
        .eq('status', 'cancelled')
        .order('start_date', { ascending: false }),
    ])

    if (entryResult.error) setError(entryResult.error.message)
    else setEntries((entryResult.data || []) as LedgerEntry[])

    if (bookingResult.error) setError((old) => old || bookingResult.error.message)
    else setBookings((bookingResult.data || []) as Booking[])

    if (profileResult.error) setError((old) => old || profileResult.error.message)
    else {
      const map: Record<string, Profile> = {}
      for (const p of (profileResult.data || []) as Profile[]) map[p.id] = p
      setProfiles(map)
    }

    if (depositResult.error) setError((old) => old || depositResult.error.message)
    else setDeposits((depositResult.data || []) as Deposit[])

    if (cancelledResult.error) setError((old) => old || cancelledResult.error.message)
    else setCancelledBookings((cancelledResult.data || []) as Booking[])

    setLoading(false)
  }

  useEffect(() => { load() }, [year])

  const paidBookingIds = useMemo(
    () => new Set(entries.filter((e) => e.entry_type === 'rental_income' && !e.correction_of).map((e) => e.booking_id)),
    [entries],
  )

  const unpaidBookings = useMemo(
    () => bookings.filter((b) => !paidBookingIds.has(b.id)),
    [bookings, paidBookingIds],
  )

  const totals = useMemo(() => {
    let revenue = 0
    let expenses = 0
    let bankDeposits = 0
    let withdrawals = 0
    let contributions = 0
    let corrections = 0
    let cashBalance = 0

    for (const e of entries) {
      const value = Number(e.amount)
      if (e.entry_type === 'rental_income') { revenue += value; cashBalance += value }
      if (e.entry_type === 'business_expense') { expenses += value; cashBalance -= value }
      if (e.entry_type === 'bank_deposit') { bankDeposits += value; cashBalance -= value }
      if (e.entry_type === 'private_withdrawal') { withdrawals += value; cashBalance -= value }
      if (e.entry_type === 'private_contribution') { contributions += value; cashBalance += value }
      if (e.entry_type === 'correction') { corrections += value; cashBalance += value }
    }

    return {
      revenue,
      expenses,
      profit: revenue - expenses,
      bankDeposits,
      withdrawals,
      contributions,
      corrections,
      cashBalance,
    }
  }, [entries])

  const heldDeposits = useMemo(
    () => deposits.filter((d) => d.status === 'held').reduce((sum, d) => sum + Number(d.amount), 0),
    [deposits],
  )

  async function addEntry(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    const parsed = Number(amount.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Bitte einen gültigen Betrag größer als 0 eingeben.')
      return
    }
    if (!description.trim()) {
      setError('Bitte eine Beschreibung eingeben.')
      return
    }

    setBusy(true)
    const { error: rpcError } = await supabase.rpc('admin_add_accounting_entry', {
      p_entry_date: entryDate,
      p_entry_type: entryType,
      p_amount: parsed,
      p_description: description.trim(),
      p_counterparty: counterparty.trim(),
      p_reference: reference.trim(),
    })
    setBusy(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setFormOpen(false)
    setAmount('')
    setDescription('')
    setCounterparty('')
    setReference('')
    setNotice('Buchung wurde im Kassenbuch erfasst.')
    await load()
  }

  async function markBookingPaid(booking: Booking) {
    if (booking.total_price == null) {
      setError('Für diese Buchung ist kein fester Mietpreis hinterlegt.')
      return
    }
    if (!window.confirm(`${money(Number(booking.total_price))} Barzahlung als erhalten verbuchen?`)) return

    setBusy(true)
    setError('')
    setNotice('')
    const renter = profiles[booking.user_id]
    const { error: rpcError } = await supabase.rpc('admin_record_cash_rental_payment', {
      p_booking_id: booking.id,
    })
    setBusy(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setNotice(`Barzahlung von ${renter?.full_name || 'Kunde'} wurde verbucht.`)
    await load()
  }

  async function createDeposit(event: FormEvent) {
    event.preventDefault()
    const parsed = Number(depositAmount.replace(',', '.'))
    if (!selectedBooking || !Number.isFinite(parsed) || parsed <= 0) {
      setError('Bitte Buchung und gültige Kaution auswählen.')
      return
    }
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('admin_receive_security_deposit', {
      p_booking_id: selectedBooking,
      p_amount: parsed,
      p_note: depositNote.trim(),
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setDepositOpen(false)
    setSelectedBooking('')
    setDepositAmount('')
    setDepositNote('')
    setNotice('Kaution wurde separat erfasst und zählt nicht zum Umsatz.')
    await load()
  }

  async function returnDeposit(deposit: Deposit) {
    if (!window.confirm(`${money(Number(deposit.amount))} Kaution als zurückgegeben markieren?`)) return
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('admin_return_security_deposit', {
      p_deposit_id: deposit.id,
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setNotice('Kaution wurde als zurückgegeben markiert.')
    await load()
  }

  async function correctEntry(entry: LedgerEntry) {
    const reason = window.prompt(`Korrektur zu ${entry.receipt_number}\nGrund der Korrektur:`)
    if (!reason?.trim()) return
    setBusy(true)
    setError('')
    const { error: rpcError } = await supabase.rpc('admin_reverse_accounting_entry', {
      p_entry_id: entry.id,
      p_reason: reason.trim(),
    })
    setBusy(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setNotice('Korrekturbuchung wurde erstellt. Der ursprüngliche Datensatz bleibt erhalten.')
    await load()
  }

  async function deleteTestEntry(entry: LedgerEntry) {
    const ok = window.confirm(
      `TESTDATEN ENDGÜLTIG LÖSCHEN?\n\n${entry.receipt_number}\n${entry.description}\n${money(Number(entry.amount))}\n\nFür echte Buchhaltungsdaten später bitte immer „Korrigieren“ verwenden.`
    )
    if (!ok) return

    setBusy(true)
    setError('')
    setNotice('')

    const { error: rpcError } = await supabase.rpc('admin_delete_accounting_test_entry', {
      p_entry_id: entry.id,
    })

    setBusy(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setNotice('Test-Kassenbucheintrag wurde endgültig gelöscht.')
    await load()
  }

  async function deleteCancelledTestBooking(booking: Booking) {
    const renter = profiles[booking.user_id]?.full_name || 'Kunde'
    const ok = window.confirm(
      `STORNIERTE TESTBUCHUNG ENDGÜLTIG LÖSCHEN?\n\n${booking.trailer_title}\n${renter}\n${dateDE(booking.start_date)}\n${booking.id.slice(0,8).toUpperCase()}\n\nZugehörige Test-Kassenbucheinträge und Kautionen werden ebenfalls gelöscht.`
    )
    if (!ok) return

    setBusy(true)
    setError('')
    setNotice('')

    const { error: rpcError } = await supabase.rpc('admin_delete_cancelled_test_booking', {
      p_booking_id: booking.id,
    })

    setBusy(false)

    if (rpcError) {
      setError(rpcError.message)
      return
    }

    setNotice('Stornierte Testbuchung wurde endgültig gelöscht.')
    await load()
  }

  function exportCSV() {
    const headers = [
      'Datum', 'Belegnummer', 'Art', 'Buchungs-ID', 'Beschreibung', 'Geschäftspartner',
      'Zahlungsweg', 'Referenz', 'Betrag EUR', 'Umsatzrelevant', 'Erstellt am',
    ]
    const rows = entries.map((e) => [
      e.entry_date,
      e.receipt_number,
      typeLabels[e.entry_type],
      e.booking_id || '',
      e.description,
      e.counterparty,
      e.payment_method,
      e.reference,
      Number(e.amount).toFixed(2).replace('.', ','),
      ['rental_income', 'business_expense', 'correction'].includes(e.entry_type) ? 'Ja' : 'Nein',
      new Date(e.created_at).toLocaleString('de-DE'),
    ])

    const summary = [
      [],
      ['Jahresübersicht', String(year)],
      ['Mieteinnahmen', totals.revenue.toFixed(2).replace('.', ',')],
      ['Betriebsausgaben', totals.expenses.toFixed(2).replace('.', ',')],
      ['Vorläufiger Überschuss', totals.profit.toFixed(2).replace('.', ',')],
      ['Bankeinzahlungen', totals.bankDeposits.toFixed(2).replace('.', ',')],
      ['Privatentnahmen', totals.withdrawals.toFixed(2).replace('.', ',')],
      ['Privateinlagen', totals.contributions.toFixed(2).replace('.', ',')],
      ['Rechnerischer Kassenbestand', totals.cashBalance.toFixed(2).replace('.', ',')],
      ['Separat gehaltene Kautionen', heldDeposits.toFixed(2).replace('.', ',')],
    ]

    const csv = '\uFEFF' + [headers, ...rows, ...summary]
      .map((row) => row.map(csvCell).join(';'))
      .join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LIWA-Buchhaltung-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <main className="min-h-screen bg-[#070806] px-6 py-10 text-zinc-400">Buchhaltung wird geladen…</main>
  }

  if (!authorized) {
    return <main className="min-h-screen bg-[#070806] px-6 py-10 text-white">Kein Adminzugriff.</main>
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-8 text-white md:px-7">
      {busy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#11120f] px-8 py-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
            <div className="mt-4 text-sm text-zinc-300">Wird gespeichert…</div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">← Buchungen</Link>
            <Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Website</Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-xl border border-white/10 bg-[#11120f] px-4 py-2 text-sm">
              {Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => <option key={y}>{y}</option>)}
            </select>
            <button onClick={exportCSV} className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black">Jahr als CSV exportieren</button>
            <button onClick={() => window.print()} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Bericht drucken / PDF</button>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">LIWA Admin</div>
          <h1 className="mt-3 text-4xl font-semibold">Buchhaltung & Kasse</h1>
          <p className="mt-3 max-w-3xl text-zinc-500">
            Bareinnahmen, Ausgaben, Bankeinzahlungen, Privatbewegungen und Kautionen getrennt erfassen.
            Im späteren Echtbetrieb werden Fehler über Korrekturbuchungen berichtigt. Während der Testphase kannst du Testdaten zusätzlich endgültig löschen.
          </p>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
        {notice && <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}

        <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Mieteinnahmen', money(totals.revenue), 'Steuerlich relevante Einnahmen'],
            ['Betriebsausgaben', money(totals.expenses), 'Erfasste betriebliche Kosten'],
            ['Überschuss', money(totals.profit), 'Einnahmen minus Ausgaben'],
            ['Kassenbestand', money(totals.cashBalance), 'Rechnerischer Bargeldbestand'],
            ['Bankeinzahlungen', money(totals.bankDeposits), 'Kasse → Bank, kein neuer Umsatz'],
            ['Privatentnahmen', money(totals.withdrawals), 'Aus der Kasse privat entnommen'],
            ['Privateinlagen', money(totals.contributions), 'Privat in die Kasse eingelegt'],
            ['Kaution gehalten', money(heldDeposits), 'Separat, nicht als Mietumsatz'],
          ].map(([label, value, sub]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[.18em] text-zinc-600">{label}</div>
              <div className="mt-2 text-2xl font-semibold">{value}</div>
              <div className="mt-1 text-xs text-zinc-600">{sub}</div>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[.2em] text-amber-400">Offene Barzahlungen</div>
              <h2 className="mt-2 text-2xl font-semibold">Bestätigte Vermietungen</h2>
            </div>
            <div className="text-sm text-zinc-500">{unpaidBookings.length} noch nicht als bezahlt verbucht</div>
          </div>
          <div className="mt-5 grid gap-3">
            {unpaidBookings.length === 0 && <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">Keine offenen Barzahlungen.</div>}
            {unpaidBookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-black/20 p-4">
                <div>
                  <div className="font-medium">{b.trailer_title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {profiles[b.user_id]?.full_name || 'Kunde'} · {dateDE(b.start_date)} · {b.id.slice(0,8).toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-semibold">{b.total_price == null ? 'Auf Anfrage' : money(Number(b.total_price))}</div>
                  <button onClick={() => markBookingPaid(b)} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Barzahlung erhalten</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[.2em] text-amber-400">Kassenbuch</div>
                <h2 className="mt-2 text-2xl font-semibold">Bewegungen {year}</h2>
              </div>
              <button onClick={() => setFormOpen((v) => !v)} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">+ Eintrag</button>
            </div>

            {formOpen && (
              <form onSubmit={addEntry} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2">
                <label className="text-sm text-zinc-400">Art
                  <select value={entryType} onChange={(e) => setEntryType(e.target.value as EntryType)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white">
                    <option value="business_expense">Betriebsausgabe</option>
                    <option value="bank_deposit">Bankeinzahlung</option>
                    <option value="private_withdrawal">Privatentnahme</option>
                    <option value="private_contribution">Privateinlage</option>
                  </select>
                </label>
                <label className="text-sm text-zinc-400">Datum
                  <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white" />
                </label>
                <label className="text-sm text-zinc-400">Betrag €
                  <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white" />
                </label>
                <label className="text-sm text-zinc-400">Geschäftspartner / Empfänger
                  <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="z. B. TÜV, Tankstelle, Privat" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white" />
                </label>
                <label className="text-sm text-zinc-400 md:col-span-2">Beschreibung
                  <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="z. B. TÜV Anhänger 1" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white" />
                </label>
                <label className="text-sm text-zinc-400 md:col-span-2">Beleg / Referenz (optional)
                  <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Rechnungsnummer, Einzahlungsbeleg etc." className="mt-2 w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-white" />
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black">Speichern</button>
                  <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-400">Abbrechen</button>
                </div>
              </form>
            )}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-zinc-600">
                  <tr>
                    <th className="pb-3">Datum</th><th className="pb-3">Beleg</th><th className="pb-3">Art</th>
                    <th className="pb-3">Beschreibung</th><th className="pb-3">Betrag</th><th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-t border-white/[0.06]">
                      <td className="py-4 text-zinc-400">{dateDE(e.entry_date)}</td>
                      <td className="py-4 font-mono text-xs text-zinc-500">{e.receipt_number}</td>
                      <td className="py-4">{typeLabels[e.entry_type]}</td>
                      <td className="py-4">
                        <div>{e.description}</div>
                        {(e.counterparty || e.reference) && <div className="mt-1 text-xs text-zinc-600">{[e.counterparty, e.reference].filter(Boolean).join(' · ')}</div>}
                      </td>
                      <td className={`py-4 font-semibold ${['business_expense','bank_deposit','private_withdrawal'].includes(e.entry_type) ? 'text-red-200' : 'text-emerald-200'}`}>
                        {['business_expense','bank_deposit','private_withdrawal'].includes(e.entry_type) ? '−' : '+'}{money(Math.abs(Number(e.amount)))}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-3">
                          {e.entry_type !== 'correction' && !e.correction_of && (
                            <button onClick={() => correctEntry(e)} className="text-xs text-zinc-500 hover:text-white">Korrigieren</button>
                          )}
                          <button
                            onClick={() => deleteTestEntry(e)}
                            className="text-xs text-red-400/70 hover:text-red-300"
                            title="Nur zum Löschen von Testdaten"
                          >
                            Test löschen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[.2em] text-amber-400">Kautionen</div>
                <h2 className="mt-2 text-2xl font-semibold">Separat verwalten</h2>
              </div>
              <button onClick={() => setDepositOpen((v) => !v)} className="rounded-xl border border-white/10 px-3 py-2 text-sm">+ Kaution</button>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Kautionen werden bewusst nicht als Mieteinnahme in den Umsatz gerechnet.</p>

            {depositOpen && (
              <form onSubmit={createDeposit} className="mt-5 space-y-3 rounded-2xl bg-black/20 p-4">
                <select value={selectedBooking} onChange={(e) => setSelectedBooking(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-sm">
                  <option value="">Buchung auswählen</option>
                  {bookings.map((b) => <option key={b.id} value={b.id}>{b.trailer_title} · {dateDE(b.start_date)} · {b.id.slice(0,8).toUpperCase()}</option>)}
                </select>
                <input value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} inputMode="decimal" placeholder="Kaution in €" className="w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-sm" />
                <input value={depositNote} onChange={(e) => setDepositNote(e.target.value)} placeholder="Notiz (optional)" className="w-full rounded-xl border border-white/10 bg-[#11120f] px-3 py-3 text-sm" />
                <button type="submit" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Kaution erhalten</button>
              </form>
            )}

            <div className="mt-5 space-y-3">
              {deposits.length === 0 && <div className="text-sm text-zinc-600">Noch keine Kautionen erfasst.</div>}
              {deposits.map((d) => {
                const b = bookings.find((item) => item.id === d.booking_id)
                return (
                  <div key={d.id} className="rounded-2xl bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{money(Number(d.amount))}</div>
                        <div className="mt-1 text-xs text-zinc-600">{b?.trailer_title || d.booking_id.slice(0,8)} · {new Date(d.received_at).toLocaleDateString('de-DE')}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${d.status === 'held' ? 'bg-amber-400/10 text-amber-200' : 'bg-white/5 text-zinc-500'}`}>
                        {d.status === 'held' ? 'Gehalten' : d.status === 'returned' ? 'Zurückgegeben' : 'Einbehalten'}
                      </span>
                    </div>
                    {d.status === 'held' && <button onClick={() => returnDeposit(d)} className="mt-3 text-xs text-emerald-300">Als zurückgegeben markieren</button>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-red-400/15 bg-red-400/[0.04] p-5 md:p-7">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.2em] text-red-300">Nur Testphase</div>
            <h2 className="mt-2 text-2xl font-semibold">Stornierte Testbuchungen löschen</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
              Hier kannst du während der Entwicklung stornierte Testbuchungen endgültig entfernen.
              Im echten Betrieb sollten Buchungen und Buchhaltungsdaten grundsätzlich nachvollziehbar erhalten bleiben.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {cancelledBookings.length === 0 && (
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-600">
                Keine stornierten Buchungen vorhanden.
              </div>
            )}

            {cancelledBookings.map((booking) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-black/20 p-4">
                <div>
                  <div className="font-medium">{booking.trailer_title}</div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {profiles[booking.user_id]?.full_name || 'Kunde'} · {dateDE(booking.start_date)} · {booking.id.slice(0,8).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => deleteCancelledTestBooking(booking)}
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2 text-sm text-red-200 hover:bg-red-400/10"
                >
                  Testbuchung löschen
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-amber-400/15 bg-amber-400/[0.05] p-5 text-sm leading-6 text-zinc-400 md:p-7">
          <strong className="text-amber-200">Für den Jahresabschluss:</strong> Der CSV-Export enthält alle erfassten Kassenbewegungen und eine Jahressumme.
          Rechnungen, Quittungen, Bank-Einzahlungsbelege und sonstige Originalbelege solltest du zusätzlich geordnet aufbewahren. Der Bereich ist eine Buchhaltungsvorbereitung und ersetzt keine individuelle steuerliche Prüfung.
        </section>
      </div>
    </main>
  )
}

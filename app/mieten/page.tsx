'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { client } from '@/sanity/lib/client'
import { trailersQuery } from '@/sanity/lib/queries'
import { supabase } from '@/lib/supabase/client'

type Trailer = {
  _id: string
  title: string
  category?: string
  shortDescription?: string
  pricePerDay?: string
  deposit?: string
  totalWeight?: string
  payload?: string
  dimensions?: string
  licenseClass?: string
}

const fallbackTrailers: Trailer[] = [
  { _id: 'demo-kasten', title: 'Kastenanhänger 750 kg', category: 'Kastenanhänger', shortDescription: 'Praktischer Allrounder für Umzug, Garten und Alltag.', pricePerDay: '25 €', deposit: '100 €', totalWeight: '750 kg', payload: 'ca. 600 kg', dimensions: '2,05 × 1,10 m', licenseClass: 'B' },
  { _id: 'demo-hochlader', title: 'Hochlader 1.300 kg', category: 'Hochlader', shortDescription: 'Viel Ladefläche und von drei Seiten einfach zu beladen.', pricePerDay: '39 €', deposit: '150 €', totalWeight: '1.300 kg', payload: 'ca. 1.000 kg', dimensions: '2,60 × 1,50 m', licenseClass: 'B / B96 / BE*' },
  { _id: 'demo-auto', title: 'Autotransporter 2.700 kg', category: 'Autotransporter', shortDescription: 'Sicherer Fahrzeugtransport mit Auffahrrampen und Winde.', pricePerDay: '69 €', deposit: '250 €', totalWeight: '2.700 kg', payload: 'ca. 2.000 kg', dimensions: '4,00 × 2,00 m', licenseClass: 'BE*' },
]

function moneyToNumber(value?: string) {
  if (!value) return 0
  const cleaned = value.replace(/[^0-9,.-]/g, '').replace(',', '.')
  const n = Number.parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

function daysBetween(start: string, end: string) {
  if (!start || !end) return 0
  const a = new Date(`${start}T12:00:00`)
  const b = new Date(`${end}T12:00:00`)
  const diff = Math.floor((b.getTime() - a.getTime()) / 86400000)
  return diff >= 0 ? diff + 1 : 0
}

export default function RentPage() {
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = await client.fetch<Trailer[]>(trailersQuery)
        const list = data?.length ? data : fallbackTrailers
        setTrailers(list)
        const query = new URLSearchParams(window.location.search)
        const preselected = query.get('trailer')
        setSelectedId(preselected && list.some((x) => x._id === preselected) ? preselected : list[0]?._id || '')
        setStartDate(query.get('from') || '')
        setEndDate(query.get('to') || '')
      } catch {
        setTrailers(fallbackTrailers)
        setSelectedId(fallbackTrailers[0]._id)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const trailer = trailers.find((x) => x._id === selectedId)
  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate])
  const pricePerDay = moneyToNumber(trailer?.pricePerDay)
  const total = pricePerDay * days
  const today = new Date().toISOString().slice(0, 10)

  async function createBooking() {
    setError('')
    setSuccessId('')
    if (!trailer) return setError('Bitte wähle einen Anhänger aus.')
    if (!startDate || !endDate || days < 1) return setError('Bitte wähle einen gültigen Mietzeitraum aus.')
    if (startDate < today) return setError('Das Startdatum darf nicht in der Vergangenheit liegen.')

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      const next = `/mieten?trailer=${encodeURIComponent(selectedId)}&from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`
      window.location.href = `/login?next=${encodeURIComponent(next)}`
      return
    }

    setSaving(true)
    const { data, error } = await supabase.rpc('create_booking', {
      p_trailer_id: trailer._id,
      p_trailer_title: trailer.title,
      p_start_date: startDate,
      p_end_date: endDate,
      p_days: days,
      p_price_per_day: pricePerDay || null,
      p_total_price: pricePerDay ? total : null,
      p_note: note,
    })
    setSaving(false)

    if (error) {
      const message = error.message.includes('bereits reserviert') ? 'Dieser Anhänger ist im gewählten Zeitraum bereits reserviert. Bitte wähle andere Termine.' : error.message
      setError(message)
      return
    }
    setSuccessId(String(data || ''))
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-8 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Zur Startseite</Link>
          <Link href="/konto" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5">Kundenbereich</Link>
        </div>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Online reservieren</div>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Anhänger mieten</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-500">Wähle Anhänger und Zeitraum. Die Buchung wird zunächst als Anfrage gespeichert und kann später bestätigt werden. Online-Zahlung ist noch nicht aktiv.</p>
        </div>

        {loading ? <div className="mt-12 text-zinc-500">Anhänger werden geladen…</div> : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
              <h2 className="text-xl font-semibold">1. Anhänger auswählen</h2>
              <div className="mt-5 grid gap-3">
                {trailers.map((item) => (
                  <button key={item._id} onClick={() => setSelectedId(item._id)} className={`rounded-2xl border p-4 text-left transition ${selectedId === item._id ? 'border-amber-400/70 bg-amber-400/[0.08]' : 'border-white/10 bg-black/20 hover:border-white/20'}`}>
                    <div className="flex items-start justify-between gap-4"><div><div className="font-semibold text-zinc-100">{item.title}</div><div className="mt-1 text-xs text-amber-300">{item.category}</div></div><div className="text-right font-semibold">{item.pricePerDay || 'Auf Anfrage'}<div className="text-xs font-normal text-zinc-600">pro Tag</div></div></div>
                    <p className="mt-3 text-sm leading-6 text-zinc-500">{item.shortDescription}</p>
                  </button>
                ))}
              </div>

              <h2 className="mt-8 text-xl font-semibold">2. Mietzeitraum</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-sm text-zinc-300">Abholung<input type="date" min={today} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value > endDate) setEndDate('') }} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 [color-scheme:dark] outline-none focus:border-amber-400/60" /></label>
                <label className="text-sm text-zinc-300">Rückgabe<input type="date" min={startDate || today} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 [color-scheme:dark] outline-none focus:border-amber-400/60" /></label>
              </div>
              <label className="mt-5 block text-sm text-zinc-300">Hinweis zur Buchung (optional)<textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="z. B. gewünschte Abholzeit" className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-amber-400/60" /></label>
            </section>

            <aside className="h-fit rounded-[2rem] border border-amber-400/15 bg-amber-400/[0.05] p-5 md:p-7 lg:sticky lg:top-6">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">Zusammenfassung</div>
              <h2 className="mt-3 text-2xl font-semibold">{trailer?.title || 'Anhänger auswählen'}</h2>
              {trailer && <div className="mt-5 grid grid-cols-2 gap-3 text-sm">{[['Gesamtgewicht', trailer.totalWeight], ['Nutzlast', trailer.payload], ['Ladefläche', trailer.dimensions], ['Führerschein', trailer.licenseClass]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="text-xs text-zinc-600">{label}</div><div className="mt-1 text-zinc-300">{value || '—'}</div></div>)}</div>}
              <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm"><div className="flex justify-between text-zinc-400"><span>Mietdauer</span><span>{days || 0} Tag{days === 1 ? '' : 'e'}</span></div><div className="flex justify-between text-zinc-400"><span>Tagespreis</span><span>{trailer?.pricePerDay || 'Auf Anfrage'}</span></div><div className="flex justify-between text-zinc-400"><span>Kaution</span><span>{trailer?.deposit || '—'}</span></div><div className="flex justify-between border-t border-white/10 pt-3 text-lg font-semibold"><span>Voraussichtlich</span><span>{pricePerDay && days ? `${total.toFixed(2).replace('.', ',')} €` : 'Auf Anfrage'}</span></div></div>
              {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
              {successId && <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-100"><div className="font-semibold">Buchung wurde gespeichert.</div><div className="mt-1 text-emerald-200/70">Du findest sie jetzt in deinem Kundenbereich.</div><Link href="/konto" className="mt-3 inline-block font-semibold text-white underline">Buchung ansehen →</Link></div>}
              {!successId && <button onClick={createBooking} disabled={saving || !trailer} className="mt-6 w-full rounded-xl bg-amber-400 px-4 py-3.5 font-semibold text-black transition hover:bg-amber-300 disabled:opacity-50">{saving ? 'Buchung wird gespeichert…' : 'Mietanfrage verbindlich senden'}</button>}
              <p className="mt-4 text-xs leading-5 text-zinc-600">Es findet noch keine Online-Zahlung statt. Der angezeigte Preis ist die aktuelle Berechnung aus dem Tagespreis.</p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

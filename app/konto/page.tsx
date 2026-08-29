'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type Booking = {
  id: string
  trailer_title: string
  start_date: string
  end_date: string
  days: number
  total_price: number | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  note: string
  pickup_time: string | null
  payment_method: 'cash' | 'online'
  payment_status: string | null
  created_at: string
}

type Profile = { full_name: string; phone: string }

const statusLabels: Record<Booking['status'], string> = { pending: 'Angefragt', confirmed: 'Bestätigt', cancelled: 'Storniert', completed: 'Abgeschlossen' }

const CONTACT_PHONE_DISPLAY = '01517 0387967'
const CONTACT_PHONE_HREF = 'tel:+4915170387967'

function bookingStartDateTime(booking: Booking) {
  const time = booking.pickup_time?.slice(0, 5) || '00:00'
  return new Date(`${booking.start_date}T${time}:00`)
}

function canSelfCancel(booking: Booking) {
  const start = bookingStartDateTime(booking)
  return start.getTime() - Date.now() >= 24 * 60 * 60 * 1000
}

export default function AccountPage() {
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) {
        window.location.href = '/login?next=/konto'
        return
      }
      setEmail(auth.user.email || '')
      const [profileResult, bookingResult] = await Promise.all([
        supabase.from('profiles').select('full_name,phone').eq('id', auth.user.id).maybeSingle(),
        supabase.from('bookings').select('id,trailer_title,start_date,end_date,pickup_time,days,total_price,payment_method,payment_status,status,note,created_at').eq('user_id', auth.user.id).is('deleted_at', null).order('start_date', { ascending: false }),
      ])
      if (profileResult.data) setProfile(profileResult.data)
      if (bookingResult.error) setError(bookingResult.error.message)
      else setBookings((bookingResult.data || []) as Booking[])
      setLoading(false)
    }
    load()
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function cancelBooking(id: string) {
    if (!window.confirm('Möchtest du diese verbindliche Reservierung wirklich kostenlos stornieren?')) return
    const { error } = await supabase.rpc('cancel_own_booking', { p_booking_id: id })
    if (error) return setError(error.message)
    setBookings((items) => items.map((item) => item.id === id ? { ...item, status: 'cancelled' } : item))
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-8 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/" className="text-sm text-zinc-400 hover:text-white">← Zur Startseite</Link><button onClick={logout} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">Ausloggen</button></div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[.35fr_.65fr]">
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-6">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">Mein Konto</div>
            <h1 className="mt-3 text-3xl font-semibold">Kundenbereich</h1>
            {loading ? <p className="mt-6 text-sm text-zinc-500">Daten werden geladen…</p> : <div className="mt-6 space-y-4 text-sm"><div><div className="text-xs text-zinc-600">Name</div><div className="mt-1 text-zinc-200">{profile?.full_name || '—'}</div></div><div><div className="text-xs text-zinc-600">E-Mail</div><div className="mt-1 break-all text-zinc-200">{email}</div></div><div><div className="text-xs text-zinc-600">Telefon</div><div className="mt-1 text-zinc-200">{profile?.phone || '—'}</div></div></div>}
            <Link href="/mieten" className="mt-7 block rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-black hover:bg-amber-300">Neue Miete anfragen</Link>
          </aside>

          <section>
            <div className="flex items-end justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-400">Übersicht</div><h2 className="mt-2 text-3xl font-semibold">Meine Mieten</h2></div><div className="text-sm text-zinc-600">{bookings.length} Buchung{bookings.length === 1 ? '' : 'en'}</div></div>
            {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-6 text-zinc-500">
              <span className="font-semibold text-zinc-300">Stornierung:</span> Kostenlos bis 24 Stunden vor Mietbeginn direkt im Kundenbereich. Danach bitte telefonisch unter{' '}
              <a href={CONTACT_PHONE_HREF} className="text-amber-300 hover:text-amber-200">{CONTACT_PHONE_DISPLAY}</a>{' '}
              Kontakt aufnehmen. Bei späteren Stornierungen können 50 % des Mietpreises als Stornierungsgebühr berechnet werden.
            </div>
            {!loading && bookings.length === 0 && <div className="mt-6 rounded-[2rem] border border-dashed border-white/10 p-10 text-center"><div className="text-lg font-semibold">Noch keine Miete vorhanden</div><p className="mt-2 text-sm text-zinc-500">Sobald du einen Anhänger buchst, erscheint die Miete hier.</p><Link href="/mieten" className="mt-5 inline-block rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-black">Anhänger mieten</Link></div>}
            <div className="mt-6 grid gap-4">
              {bookings.map((booking) => (
                <article key={booking.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 md:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.18em] text-zinc-600">Buchung {booking.id.slice(0, 8).toUpperCase()}</div><h3 className="mt-2 text-xl font-semibold">{booking.trailer_title}</h3></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${booking.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-300' : booking.status === 'cancelled' ? 'bg-red-400/10 text-red-300' : booking.status === 'completed' ? 'bg-zinc-400/10 text-zinc-300' : 'bg-amber-400/10 text-amber-300'}`}>{statusLabels[booking.status]}</span></div>
                  <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Abholung</div><div className="mt-1 text-zinc-300">{new Date(`${booking.start_date}T12:00:00`).toLocaleDateString('de-DE')}</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Abholzeit</div><div className="mt-1 text-zinc-300">{booking.pickup_time ? `${booking.pickup_time.slice(0, 5)} Uhr` : '—'}</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Rückgabe</div><div className="mt-1 text-zinc-300">{new Date(`${booking.end_date}T12:00:00`).toLocaleDateString('de-DE')} · {booking.pickup_time ? `${booking.pickup_time.slice(0, 5)} Uhr` : '—'}</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Preis</div><div className="mt-1 text-zinc-300">{booking.total_price == null ? 'Auf Anfrage' : `${Number(booking.total_price).toFixed(2).replace('.', ',')} €`}</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Zahlungsart</div><div className="mt-1 text-zinc-300">{booking.payment_method === 'online' ? 'Online-Zahlung' : 'Barzahlung'}</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Kaution</div><div className="mt-1 text-zinc-300">Immer bar</div></div><div className="rounded-xl bg-black/20 p-3"><div className="text-xs text-zinc-600">Zahlungsstatus</div><div className="mt-1 text-zinc-300">{booking.payment_status === 'paid_online' ? 'Online bezahlt' : booking.payment_status === 'paid_cash' ? 'Bar bezahlt' : 'Offen'}</div></div></div>
                  {booking.note && <div className="mt-4 text-sm text-zinc-500"><span className="text-zinc-400">Hinweis:</span> {booking.note}</div>}
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <div className="mt-5 border-t border-white/10 pt-4">
                      {canSelfCancel(booking) ? (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs leading-5 text-zinc-600">
                            Kostenlose Selbststornierung bis 24 Stunden vor Mietbeginn möglich.
                          </div>
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-2 text-sm text-red-200 transition hover:bg-red-400/10"
                          >
                            Reservierung stornieren
                          </button>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4">
                          <div className="text-sm font-semibold text-amber-100">Stornierung nur noch per Kontaktaufnahme</div>
                          <p className="mt-1 text-xs leading-5 text-zinc-500">
                            Weniger als 24 Stunden vor Mietbeginn ist eine Selbststornierung nicht mehr möglich.
                            Bitte kontaktiere uns unter der angegebenen Telefonnummer. Für späte Stornierungen können 50 % des Mietpreises als Stornierungsgebühr berechnet werden.
                          </p>
                          <a
                            href={CONTACT_PHONE_HREF}
                            className="mt-3 inline-flex rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black"
                          >
                            {CONTACT_PHONE_DISPLAY} anrufen
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

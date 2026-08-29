'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { client, urlFor } from '@/sanity/lib/client'
import { trailersQuery } from '@/sanity/lib/queries'

type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed'
type PaymentMethod = 'cash' | 'online'

type Booking = {
  id: string
  user_id: string
  trailer_title: string
  start_date: string
  end_date: string
  pickup_time: string | null
  pickup_time_wish: string | null
  days: number
  total_price: number | null
  payment_method: PaymentMethod
  status: Status
  created_at: string
}

type Profile = {
  id: string
  full_name: string
  email: string
  phone: string
}

type SanityImage = {
  asset?: {
    _ref?: string
  }
}

type Trailer = {
  _id: string
  title: string
  category?: string
  heroImage?: SanityImage
  gallery?: SanityImage[]
}

const ALL_PICKUP_TIMES = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

const labels: Record<Status, string> = {
  pending: 'Angefragt',
  confirmed: 'Bestätigt',
  cancelled: 'Storniert',
  completed: 'Abgeschlossen',
}

function dateDE(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('de-DE')
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | Status>('pending')
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [pickupTimes, setPickupTimes] = useState<Record<string, string[]>>({})
  const [savingTimesId, setSavingTimesId] = useState('')
  const [timesNotice, setTimesNotice] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      window.location.href = '/login?next=/admin'
      return
    }

    const { data: allowed, error: adminError } = await supabase.rpc('is_current_user_admin')
    if (adminError || !allowed) {
      setAuthorized(false)
      setError(adminError?.message || '')
      setLoading(false)
      return
    }

    setAuthorized(true)

    const [bookingResult, profileResult, pickupSettingsResult, publicTrailers] = await Promise.all([
      supabase.from('bookings')
        .select('id,user_id,trailer_title,start_date,end_date,pickup_time,pickup_time_wish,days,total_price,payment_method,status,created_at')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,full_name,email,phone'),
      supabase.from('trailer_pickup_settings').select('trailer_id,available_times'),
      client.fetch<Trailer[]>(trailersQuery),
    ])

    if (bookingResult.error) setError(bookingResult.error.message)
    else setBookings((bookingResult.data || []) as Booking[])

    if (profileResult.error) setError((old) => old || profileResult.error.message)
    else {
      const map: Record<string, Profile> = {}
      for (const profile of (profileResult.data || []) as Profile[]) map[profile.id] = profile
      setProfiles(map)
    }

    if (pickupSettingsResult.error) {
      setError((old) => old || `Abholzeiten konnten nicht geladen werden: ${pickupSettingsResult.error.message}`)
    } else {
      const map: Record<string, string[]> = {}
      for (const row of pickupSettingsResult.data || []) {
        map[String(row.trailer_id)] = Array.isArray(row.available_times)
          ? row.available_times.map(String)
          : []
      }
      setPickupTimes(map)
    }

    setTrailers(publicTrailers || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = useMemo(
    () => filter === 'all' ? bookings : bookings.filter((b) => b.status === filter),
    [bookings, filter],
  )

  async function changeStatus(id: string, status: Status) {
    if (!window.confirm('Status dieser Buchung wirklich ändern?')) return
    setBusyId(id)
    setError('')
    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token

    if (!accessToken) {
      setBusyId('')
      setError('Deine Sitzung ist abgelaufen. Bitte logge dich erneut ein.')
      return
    }

    const response = await fetch('/api/admin-booking-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ bookingId: id, status }),
    })

    const result = await response.json().catch(() => null)
    setBusyId('')

    if (!response.ok) {
      setError(result?.error || 'Der Buchungsstatus konnte nicht geändert werden.')
      return
    }

    setBookings((items) =>
      items.map((item) => item.id === id ? { ...item, status } : item),
    )
  }

  function trailerImage(trailer: Trailer) {
    const image = trailer.heroImage || trailer.gallery?.[0]
    try {
      return image?.asset?._ref
        ? urlFor(image).width(720).height(440).fit('crop').url()
        : ''
    } catch {
      return ''
    }
  }

  function currentTimes(trailerId: string) {
    return pickupTimes[trailerId] ?? ALL_PICKUP_TIMES
  }

  function togglePickupTime(trailerId: string, time: string) {
    const active = currentTimes(trailerId)
    setPickupTimes((old) => ({
      ...old,
      [trailerId]: active.includes(time)
        ? active.filter((item) => item !== time)
        : [...active, time].sort(),
    }))
    setTimesNotice('')
  }

  async function savePickupTimes(trailerId: string) {
    setSavingTimesId(trailerId)
    setTimesNotice('')
    setError('')

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setSavingTimesId('')
      setError('Deine Sitzung ist abgelaufen.')
      return
    }

    const { error: saveError } = await supabase
      .from('trailer_pickup_settings')
      .upsert(
        {
          trailer_id: trailerId,
          available_times: currentTimes(trailerId),
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'trailer_id' },
      )

    setSavingTimesId('')

    if (saveError) {
      setError(saveError.message)
      return
    }

    setTimesNotice('Abholzeiten gespeichert.')
  }

  if (loading) {
    return <main className="min-h-screen bg-[#070806] px-6 py-10 text-zinc-400">Adminbereich wird geladen…</main>
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#070806] px-6 py-10 text-white">
        <div className="mx-auto max-w-xl">
          <Link href="/" className="text-sm text-zinc-400">← Zur Startseite</Link>
          <div className="mt-10 rounded-[2rem] border border-red-400/20 bg-red-400/[0.06] p-7">
            <h1 className="text-3xl font-semibold">Kein Adminzugriff</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Dein Konto ist noch nicht als Administrator freigeschaltet.</p>
            {error && <p className="mt-4 text-sm text-red-200">{error}</p>}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-8 text-white md:px-7">
      {busyId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-2xl border border-white/10 bg-[#11120f] px-8 py-6 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
            <div className="mt-4 text-sm text-zinc-300">Buchung wird aktualisiert…</div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">← Website</Link>
          <div className="flex gap-2">
            <Link href="/admin/buchhaltung" className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black">Buchhaltung</Link>
            <Link href="/studio" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Sanity Studio</Link>
            <button onClick={load} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300">Aktualisieren</button>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Admin</div>
          <h1 className="mt-3 text-4xl font-semibold">Buchungsverwaltung</h1>
          <p className="mt-3 text-zinc-500">Anfragen bestätigen, ablehnen und alle wichtigen Mieterdaten einsehen.</p>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
                Abholzeiten
              </div>
              <h2 className="mt-2 text-2xl font-semibold">Verfügbare Zeiten je Anhänger</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                Hier legst du für jeden aktuell veröffentlichten Anhänger fest, welche festen
                Abholzeiten Kunden bei der Online-Reservierung auswählen können. Die Einstellung
                gilt generell für den jeweiligen Anhänger und nicht für einzelne Tage.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-500">
              {trailers.length} öffentliche Anhänger
            </div>
          </div>

          {timesNotice && (
            <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-3 text-sm text-emerald-200">
              {timesNotice}
            </div>
          )}

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {trailers.map((trailer) => {
              const activeTimes = currentTimes(trailer._id)
              const image = trailerImage(trailer)

              return (
                <article
                  key={trailer._id}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                >
                  <div className="grid sm:grid-cols-[160px_1fr]">
                    <div className="min-h-32 bg-white/[0.03]">
                      {image ? (
                        <img
                          src={image}
                          alt={trailer.title}
                          className="h-full min-h-32 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full min-h-32 items-center justify-center text-xs text-zinc-600">
                          Kein Bild
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                        {trailer.category || 'Anhänger'}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold">{trailer.title}</h3>
                      <div className="mt-1 text-xs text-zinc-500">
                        {activeTimes.length} feste Abholzeit{activeTimes.length === 1 ? '' : 'en'} aktiv
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {ALL_PICKUP_TIMES.map((time) => {
                        const active = activeTimes.includes(time)
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => togglePickupTime(trailer._id, time)}
                            className={`rounded-xl border px-2 py-2.5 text-sm transition ${
                              active
                                ? 'border-emerald-400/30 bg-emerald-400/[0.12] font-semibold text-emerald-200'
                                : 'border-white/10 bg-white/[0.025] text-zinc-600 hover:text-zinc-300'
                            }`}
                          >
                            {time}
                          </button>
                        )
                      })}
                    </div>

                    {activeTimes.length === 0 && (
                      <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-2 text-xs leading-5 text-amber-100">
                        Für diesen Anhänger ist momentan keine feste Abholzeit freigegeben.
                      </div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => savePickupTimes(trailer._id)}
                        disabled={savingTimesId === trailer._id}
                        className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
                      >
                        {savingTimesId === trailer._id ? 'Speichert …' : 'Zeiten speichern'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <div className="mt-7 flex flex-wrap gap-2">
          {([
            ['pending', 'Offene Anfragen'],
            ['confirmed', 'Bestätigt'],
            ['completed', 'Abgeschlossen'],
            ['cancelled', 'Storniert'],
            ['all', 'Alle'],
          ] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm ${filter === value ? 'bg-amber-400 font-semibold text-black' : 'border border-white/10 text-zinc-400'}`}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <div className="mt-6 grid gap-4">
          {visible.length === 0 && <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center text-zinc-500">Keine Buchungen in dieser Ansicht.</div>}

          {visible.map((booking) => {
            const renter = profiles[booking.user_id]
            return (
              <article key={booking.id} className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">Buchung {booking.id.slice(0, 8).toUpperCase()}</div>
                    <h2 className="mt-2 text-2xl font-semibold">{booking.trailer_title}</h2>
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs">{labels[booking.status]}</span>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-black/20 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Mieter</div>
                    <div className="mt-4 space-y-3 text-sm">
                      <div><span className="text-zinc-600">Name:</span> <span className="text-zinc-200">{renter?.full_name || '—'}</span></div>
                      <div><span className="text-zinc-600">E-Mail:</span> <span className="break-all text-zinc-200">{renter?.email || '—'}</span></div>
                      <div><span className="text-zinc-600">Telefon:</span> <span className="text-zinc-200">{renter?.phone || '—'}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-black/20 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">Buchung</div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div><div className="text-xs text-zinc-600">Abholung</div><div className="mt-1">{dateDE(booking.start_date)} · {booking.pickup_time?.slice(0,5) || '—'} Uhr</div></div>
                      <div><div className="text-xs text-zinc-600">Rückgabe</div><div className="mt-1">{dateDE(booking.end_date)} · {booking.pickup_time?.slice(0,5) || '—'} Uhr</div></div>
                      <div className="sm:col-span-2">
                        <div className="text-xs text-zinc-600">Zusätzlicher Uhrzeitwunsch</div>
                        <div className="mt-1 text-amber-200">{booking.pickup_time_wish || 'Kein zusätzlicher Wunsch'}</div>
                      </div>
                      <div><div className="text-xs text-zinc-600">Mietdauer</div><div className="mt-1">{booking.days} Tag{booking.days === 1 ? '' : 'e'}</div></div>
                      <div><div className="text-xs text-zinc-600">Preis</div><div className="mt-1">{booking.total_price == null ? 'Auf Anfrage' : `${Number(booking.total_price).toFixed(2).replace('.', ',')} €`}</div></div>
                      <div><div className="text-xs text-zinc-600">Zahlungsart</div><div className="mt-1">{booking.payment_method === 'online' ? 'Online-Zahlung' : 'Barzahlung'}</div></div>
                      <div><div className="text-xs text-zinc-600">Kaution</div><div className="mt-1">Immer bar</div></div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-5">
                  {booking.status === 'pending' && (
                    <>
                      <button onClick={() => changeStatus(booking.id, 'confirmed')} className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-black">Bestätigen</button>
                      <button onClick={() => changeStatus(booking.id, 'cancelled')} className="rounded-xl border border-red-400/20 px-4 py-2.5 text-sm text-red-200">Ablehnen</button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <>
                      <button onClick={() => changeStatus(booking.id, 'completed')} className="rounded-xl bg-sky-400 px-4 py-2.5 text-sm font-semibold text-black">Abschließen</button>
                      <button onClick={() => changeStatus(booking.id, 'cancelled')} className="rounded-xl border border-red-400/20 px-4 py-2.5 text-sm text-red-200">Stornieren</button>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}

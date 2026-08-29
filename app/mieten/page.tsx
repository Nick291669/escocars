'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { client, urlFor } from '@/sanity/lib/client'
import { trailersQuery } from '@/sanity/lib/queries'
import { supabase } from '@/lib/supabase/client'

type SanityImage = {
  _type?: string
  asset?: {
    _ref?: string
    _type?: string
  }
}

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
  heroImage?: SanityImage
  gallery?: SanityImage[]
}

type CalendarDay = {
  date: string
  day: number
  inCurrentMonth: boolean
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
  if (diff < 0) return 0
  return Math.max(1, diff)
}

function formatDateDE(value: string) {
  if (!value) return '—'
  return new Date(`${value}T12:00:00`).toLocaleDateString('de-DE')
}

function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}

function monthStart(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1)
}

function monthEnd(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0)
}

function buildCalendarDays(month: Date): CalendarDay[] {
  const first = monthStart(month)
  const mondayIndex = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - mondayIndex)

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(gridStart)
    current.setDate(gridStart.getDate() + index)
    return {
      date: toIsoDate(current),
      day: current.getDate(),
      inCurrentMonth: current.getMonth() === month.getMonth(),
    }
  })
}

async function withTimeout<T>(promise: PromiseLike<T>, ms = 20000): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Die Anfrage dauert zu lange. Bitte prüfe deine Internetverbindung und versuche es erneut.',
            ),
          ),
        ms,
      ),
    ),
  ])
}

function imageUrl(trailer?: Trailer) {
  const image = trailer?.heroImage || trailer?.gallery?.[0]
  try {
    return image?.asset?._ref ? urlFor(image).width(1000).height(650).fit('crop').url() : ''
  } catch {
    return ''
  }
}

export default function RentPage() {
  const [trailers, setTrailers] = useState<Trailer[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [pickupTimeWish, setPickupTimeWish] = useState('')
  const [pickupTimeSettings, setPickupTimeSettings] = useState<Record<string, string[]>>({})
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash')
  const [legalAccepted, setLegalAccepted] = useState(false)

  const [loading, setLoading] = useState(true)
  const [sanityError, setSanityError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState('')

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [pickupTimeOpen, setPickupTimeOpen] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sent' | 'failed'>('idle')
  const [pushStatus, setPushStatus] = useState<'idle' | 'sent' | 'failed'>('idle')
  const [calendarMonth, setCalendarMonth] = useState(() => monthStart(new Date()))
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set())
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [unavailableTrailerIds, setUnavailableTrailerIds] = useState<Set<string>>(new Set())

  const today = toIsoDate(new Date())

  useEffect(() => {
    async function load() {
      try {
        const data = await client.fetch<Trailer[]>(trailersQuery)
        const list = data || []
        setTrailers(list)
        setSanityError(false)

        const query = new URLSearchParams(window.location.search)
        const preselected = query.get('trailer')
        setSelectedId(
          preselected && list.some((x) => x._id === preselected)
            ? preselected
            : list[0]?._id || '',
        )
        setStartDate(query.get('from') || '')
        setEndDate(query.get('to') || '')
        setPickupTime(query.get('time') || '')
        setPickupTimeWish(query.get('wish') || '')
        setPaymentMethod('cash')

        const { data: pickupSettings, error: pickupSettingsError } = await supabase
          .from('trailer_pickup_settings')
          .select('trailer_id,available_times')

        if (pickupSettingsError) {
          console.error('Abholzeiten:', pickupSettingsError)
        } else {
          const settingsMap: Record<string, string[]> = {}
          for (const row of pickupSettings || []) {
            settingsMap[String(row.trailer_id)] = Array.isArray(row.available_times)
              ? row.available_times.map(String)
              : []
          }
          setPickupTimeSettings(settingsMap)
        }

        const initialDate = query.get('from')
        if (initialDate) {
          const d = new Date(`${initialDate}T12:00:00`)
          if (!Number.isNaN(d.getTime())) setCalendarMonth(monthStart(d))
        }
      } catch {
        setTrailers([])
        setSelectedId('')
        setSanityError(true)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!startDate || !endDate) {
      setUnavailableTrailerIds(new Set())
      return
    }

    let cancelled = false

    async function checkRange() {
      setAvailabilityLoading(true)
      const { data, error: availabilityError } = await supabase.rpc(
        'get_unavailable_trailer_ids',
        {
          p_start_date: startDate,
          p_end_date: endDate,
        },
      )

      if (cancelled) return

      if (availabilityError) {
        console.error('Verfügbarkeitsprüfung:', availabilityError)
        setError(
          'Die Verfügbarkeit konnte nicht geprüft werden. Bitte führe das neue Supabase-Schema aus.',
        )
        setUnavailableTrailerIds(new Set())
      } else {
        const ids = new Set<string>(
          (data || []).map((row: { trailer_id: string }) => String(row.trailer_id)),
        )
        setUnavailableTrailerIds(ids)

        if (selectedId && ids.has(selectedId)) {
          setSelectedId('')
        }
      }

      setAvailabilityLoading(false)
    }

    checkRange()
    return () => {
      cancelled = true
    }
  }, [startDate, endDate, selectedId])

  useEffect(() => {
    if (!calendarOpen || !selectedId) {
      setBookedDates(new Set())
      return
    }

    let cancelled = false

    async function loadBookedDates() {
      setCalendarLoading(true)

      const from = toIsoDate(monthStart(calendarMonth))
      const to = toIsoDate(monthEnd(calendarMonth))

      const { data, error: bookedError } = await supabase.rpc('get_trailer_booked_dates', {
        p_trailer_id: selectedId,
        p_from_date: from,
        p_to_date: to,
      })

      if (cancelled) return

      if (bookedError) {
        console.error('Kalender-Verfügbarkeit:', bookedError)
        setBookedDates(new Set())
      } else {
        setBookedDates(
          new Set<string>((data || []).map((row: { booked_date: string }) => row.booked_date)),
        )
      }

      setCalendarLoading(false)
    }

    loadBookedDates()

    return () => {
      cancelled = true
    }
  }, [calendarOpen, calendarMonth, selectedId])

  const availableTrailers = useMemo(() => {
    if (!startDate || !endDate) return trailers
    return trailers.filter((item) => !unavailableTrailerIds.has(item._id))
  }, [trailers, unavailableTrailerIds, startDate, endDate])

  useEffect(() => {
    if (!selectedId && availableTrailers.length > 0 && !availabilityLoading) {
      setSelectedId(availableTrailers[0]._id)
    }
  }, [availableTrailers, selectedId, availabilityLoading])

  const trailer = trailers.find((x) => x._id === selectedId)
  const availablePickupTimes = selectedId
    ? pickupTimeSettings[selectedId] ?? ALL_PICKUP_TIMES
    : ALL_PICKUP_TIMES
  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate])
  const pricePerDay = moneyToNumber(trailer?.pricePerDay)
  const total = pricePerDay * days
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth])

  useEffect(() => {
    if (pickupTime && !availablePickupTimes.includes(pickupTime)) {
      setPickupTime('')
    }
  }, [selectedId, pickupTimeSettings, pickupTime, availablePickupTimes])

  function openCalendar() {
    setError('')
    if (startDate) {
      const d = new Date(`${startDate}T12:00:00`)
      if (!Number.isNaN(d.getTime())) setCalendarMonth(monthStart(d))
    }
    setCalendarOpen(true)
  }

  function selectCalendarDate(date: string) {
    if (date < today) return
    if (selectedId && bookedDates.has(date)) return

    if (!startDate || (startDate && endDate) || date < startDate) {
      setStartDate(date)
      setEndDate('')
      return
    }

    // Prüfen, ob im gewünschten Bereich ein roter/belegter Tag liegt.
    let cursor = startDate
    while (cursor <= date) {
      if (selectedId && bookedDates.has(cursor)) {
        setError('Der gewählte Zeitraum enthält bereits reservierte Tage.')
        return
      }
      cursor = addDays(cursor, 1)
    }

    setEndDate(date)
    setCalendarOpen(false)
  }

  function clearDates() {
    setStartDate('')
    setEndDate('')
    setUnavailableTrailerIds(new Set())
  }

  async function createBooking() {
    setError('')
    setSuccessId('')
    setEmailStatus('idle')
    setPushStatus('idle')

    if (!trailer) return setError('Bitte wähle einen verfügbaren Anhänger aus.')
    if (!startDate || !endDate || days < 1)
      return setError('Bitte wähle einen gültigen Mietzeitraum aus.')
    if (!pickupTime) return setError('Bitte wähle eine Abholzeit aus.')
    if (!paymentMethod) return setError('Bitte wähle eine Zahlungsart aus.')
    if (!legalAccepted)
      return setError('Bitte bestätige zuerst die AGB und Mietbedingungen.')
    if (startDate < today) return setError('Das Startdatum darf nicht in der Vergangenheit liegen.')
    if (unavailableTrailerIds.has(trailer._id))
      return setError('Dieser Anhänger ist im gewählten Zeitraum nicht verfügbar.')

    setSaving(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session?.user) {
        const next = `/mieten?trailer=${encodeURIComponent(
          selectedId,
        )}&from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(
          endDate,
        )}&time=${encodeURIComponent(pickupTime)}&wish=${encodeURIComponent(
          pickupTimeWish,
        )}&payment=${encodeURIComponent(paymentMethod)}`
        window.location.href = `/login?next=${encodeURIComponent(next)}`
        return
      }

      const result = await withTimeout(
        supabase.rpc('create_booking', {
          p_trailer_id: trailer._id,
          p_trailer_title: trailer.title,
          p_start_date: startDate,
          p_end_date: endDate,
          p_days: days,
          p_price_per_day: pricePerDay || null,
          p_total_price: pricePerDay ? total : null,
          p_pickup_time: pickupTime,
          p_pickup_time_wish: pickupTimeWish.trim() || null,
          p_payment_method: 'cash',
        }),
      )

      if (result.error) {
        const message = result.error.message.includes('bereits reserviert')
          ? 'Dieser Anhänger ist im gewählten Zeitraum bereits reserviert. Bitte wähle andere Termine.'
          : result.error.message
        setError(message)
        return
      }

      const bookingId = String(result.data || '')

      // E-Mail + Admin-Push nach erfolgreicher Mietanfrage.
      // Bei Online-Zahlung wird danach direkt Stripe Checkout geöffnet.
      const { data: currentSession } = await supabase.auth.getSession()
      const accessToken = currentSession.session?.access_token

      if (!accessToken) {
        setEmailStatus('failed')
        setPushStatus('failed')
      } else {
        try {
          const notificationResponse = await fetch('/api/booking-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ bookingId }),
          })

          const notificationResult = await notificationResponse.json().catch(() => null)

          if (notificationResponse.ok) {
            setEmailStatus(notificationResult?.emailSent ? 'sent' : 'failed')
            setPushStatus(notificationResult?.pushSent ? 'sent' : 'failed')
          } else {
            setEmailStatus('failed')
            setPushStatus('failed')
            console.error('Buchungs-Benachrichtigung:', notificationResult)
          }
        } catch (notificationError) {
          console.error('Buchungs-Benachrichtigung:', notificationError)
          setEmailStatus('failed')
          setPushStatus('failed')
        }
      }

      setSuccessId(bookingId)
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : 'Die Buchung konnte nicht gespeichert werden. Bitte versuche es erneut.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#070806] px-5 py-8 text-white md:px-6">
      {saving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-amber-400/20 bg-[#11120f] p-8 text-center shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
            <div className="mt-5 text-lg font-semibold">Buchung wird verarbeitet</div>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {stripeRedirecting ? 'Du wirst jetzt sicher zu Stripe weitergeleitet.' : 'Bitte kurz warten. Deine Verfügbarkeit und Buchung werden geprüft.'}
            </p>
          </div>
        </div>
      )}

      {pickupTimeOpen && (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPickupTimeOpen(false)
          }}
        >
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#10110e] p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
                  Abholung & Rückgabe
                </div>
                <h3 className="mt-2 text-2xl font-semibold">Abholzeit auswählen</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Die Rückgabe erfolgt am Rückgabetag automatisch zur gleichen Uhrzeit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPickupTimeOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-zinc-400 hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availablePickupTimes.map((time) => {
                const selected = pickupTime === time
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      setPickupTime(time)
                      setPickupTimeOpen(false)
                    }}
                    className={`rounded-2xl border px-4 py-4 text-center transition ${
                      selected
                        ? 'border-amber-300 bg-amber-400 font-semibold text-black'
                        : 'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-100 hover:border-emerald-300/60 hover:bg-emerald-400/[0.15]'
                    }`}
                  >
                    <div className="text-lg font-semibold">{time}</div>
                    <div
                      className={`mt-1 text-[11px] ${
                        selected ? 'text-black/60' : 'text-emerald-200/50'
                      }`}
                    >
                      verfügbar
                    </div>
                  </button>
                )
              })}
            </div>

            {availablePickupTimes.length === 0 && (
              <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
                Für diesen Anhänger ist aktuell keine feste Online-Abholzeit freigegeben.
                Bitte kontaktiere uns vor der Reservierung.
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <label className="text-sm font-semibold text-white">
                Uhrzeitwunsch <span className="font-normal text-zinc-600">(optional)</span>
              </label>
              <input
                type="text"
                value={pickupTimeWish}
                onChange={(event) => setPickupTimeWish(event.target.value)}
                maxLength={80}
                placeholder="z. B. möglichst 18:30 Uhr"
                className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-700 focus:border-amber-400/40"
              />
              <p className="mt-3 text-xs leading-6 text-zinc-500">
                Ein Uhrzeitwunsch ist keine bestätigte Abholzeit. Wir prüfen deinen Wunsch
                separat und geben dir eine eigene Rückmeldung, ob er möglich ist. Falls nicht,
                schlagen wir dir nach Möglichkeit eine andere Uhrzeit vor. Bis dahin gilt die
                oben ausgewählte feste Abholzeit.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
              <span className="font-semibold">Rückgabezeit:</span>{' '}
              {pickupTime ? `${pickupTime} Uhr` : 'wird automatisch übernommen'}
            </div>
          </div>
        </div>
      )}

      {calendarOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCalendarOpen(false)
          }}
        >
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-[#10110e] p-5 shadow-2xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400">
                  Mietzeitraum
                </div>
                <h3 className="mt-2 text-2xl font-semibold">Datum auswählen</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Erst Abholung, danach Rückgabe auswählen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="rounded-xl border border-white/10 px-3 py-2 text-zinc-400 hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                  )
                }
                className="rounded-xl border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5"
              >
                ←
              </button>
              <div className="font-semibold">
                {calendarMonth.toLocaleDateString('de-DE', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCalendarMonth(
                    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                  )
                }
                className="rounded-xl border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5"
              >
                →
              </button>
            </div>

            {!selectedId && (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
                Wähle zuerst einen Anhänger aus, damit belegte Tage rot markiert werden können.
              </div>
            )}

            <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs text-zinc-600">
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                <div key={day} className="py-2 font-medium">
                  {day}
                </div>
              ))}
            </div>

            <div className="relative grid grid-cols-7 gap-1.5">
              {calendarDays.map((item) => {
                const past = item.date < today
                const booked = selectedId ? bookedDates.has(item.date) : false
                const selectedStart = item.date === startDate
                const selectedEnd = item.date === endDate
                const inRange =
                  Boolean(startDate && endDate) &&
                  item.date > startDate &&
                  item.date < endDate
                const clickable = item.inCurrentMonth && !past && !booked

                let classes =
                  'relative aspect-square rounded-xl border text-sm transition flex items-center justify-center '

                if (!item.inCurrentMonth) {
                  classes += 'border-transparent text-zinc-800 '
                } else if (past) {
                  classes += 'border-white/5 bg-white/[0.02] text-zinc-700 cursor-not-allowed '
                } else if (booked) {
                  classes +=
                    'border-red-400/30 bg-red-400/[0.12] text-red-300 cursor-not-allowed '
                } else if (selectedStart || selectedEnd) {
                  classes += 'border-amber-300 bg-amber-400 text-black font-bold '
                } else if (inRange) {
                  classes += 'border-amber-400/25 bg-amber-400/[0.12] text-amber-100 '
                } else {
                  classes +=
                    'border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-400/[0.15] '
                }

                return (
                  <button
                    key={item.date}
                    type="button"
                    disabled={!clickable}
                    onClick={() => selectCalendarDate(item.date)}
                    className={classes}
                    title={
                      booked
                        ? 'Nicht verfügbar'
                        : past
                          ? 'Vergangenes Datum'
                          : 'Verfügbar'
                    }
                  >
                    {item.day}
                  </button>
                )
              })}

              {calendarLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#10110e]/70 backdrop-blur-[1px]">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="h-3 w-3 rounded-full border border-emerald-400/30 bg-emerald-400/20" />
                Grün = verfügbar
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="h-3 w-3 rounded-full border border-red-400/30 bg-red-400/20" />
                Rot = reserviert / gebucht
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                Deine Auswahl
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <div className="text-sm text-zinc-400">
                <span className="text-zinc-600">Abholung:</span> {formatDateDE(startDate)}
                <span className="mx-2 text-zinc-700">→</span>
                <span className="text-zinc-600">Rückgabe:</span> {formatDateDE(endDate)}
              </div>
              <button
                type="button"
                onClick={clearDates}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Auswahl löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-400 hover:text-white">
            ← Zur Startseite
          </Link>
          <Link
            href="/konto"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            Kundenbereich
          </Link>
        </div>

        <div className="mt-10">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Online reservieren
          </div>
          <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Anhänger mieten</h1>
          <p className="mt-4 max-w-2xl leading-7 text-zinc-500">
            Wähle Anhänger und Zeitraum. Belegte Anhänger verschwinden automatisch aus der
            Auswahl. Im Kalender siehst du sofort, welche Tage verfügbar sind.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 flex items-center gap-3 text-zinc-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
            Anhänger werden geladen…
          </div>
        ) : sanityError ? (
          <div className="mt-10 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-6 text-red-100">
            <div className="font-semibold">Sanity konnte nicht geladen werden.</div>
            <p className="mt-2 text-sm text-red-100/60">
              Prüfe deine Sanity-Verbindung.
            </p>
          </div>
        ) : trailers.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-400">
            Noch keine Anhänger in Sanity vorhanden.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">1. Anhänger auswählen</h2>
                {startDate && endDate && (
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    {availabilityLoading && (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/10 border-t-amber-400" />
                    )}
                    {availabilityLoading
                      ? 'Verfügbarkeit wird geprüft…'
                      : `${availableTrailers.length} von ${trailers.length} verfügbar`}
                  </div>
                )}
              </div>

              {startDate && endDate && availableTrailers.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-100">
                  In diesem Zeitraum ist aktuell kein Anhänger verfügbar. Wähle bitte einen
                  anderen Zeitraum.
                </div>
              ) : (
                <div className="mt-5 grid gap-3">
                  {availableTrailers.map((item) => {
                    const image = imageUrl(item)
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => setSelectedId(item._id)}
                        className={`overflow-hidden rounded-2xl border text-left transition ${
                          selectedId === item._id
                            ? 'border-amber-400/70 bg-amber-400/[0.08]'
                            : 'border-white/10 bg-black/20 hover:border-white/20'
                        }`}
                      >
                        <div className="grid sm:grid-cols-[150px_1fr]">
                          <div className="relative min-h-28 bg-black/30 sm:min-h-full">
                            {image ? (
                              <img
                                src={image}
                                alt={item.title}
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-700">
                                Kein Bild
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="font-semibold text-zinc-100">{item.title}</div>
                                <div className="mt-1 text-xs text-amber-300">
                                  {item.category || 'Anhänger'}
                                </div>
                              </div>
                              <div className="text-right font-semibold">
                                {item.pricePerDay || 'Auf Anfrage'}
                                <div className="text-xs font-normal text-zinc-600">pro Tag</div>
                              </div>
                            </div>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">
                              {item.shortDescription}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              <h2 className="mt-8 text-xl font-semibold">2. Mietzeitraum</h2>
              <button
                type="button"
                onClick={openCalendar}
                className="mt-5 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-amber-400/40"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-zinc-600">Abholung</div>
                    <div className="mt-1 font-medium text-zinc-200">{formatDateDE(startDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600">Rückgabe</div>
                    <div className="mt-1 font-medium text-zinc-200">{formatDateDE(endDate)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-amber-300">
                  Kalender öffnen · Grün verfügbar · Rot belegt
                </div>
              </button>

              <div className="mt-5">
                <div className="text-sm text-zinc-300">Abholzeit</div>
                <button
                  type="button"
                  onClick={() => setPickupTimeOpen(true)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-amber-400/40"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-zinc-600">Gewählte Zeit</div>
                      <div className="mt-1 text-lg font-semibold text-zinc-200">
                        {pickupTime ? `${pickupTime} Uhr` : 'Abholzeit auswählen'}
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-amber-300">
                      Zeit wählen
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-zinc-600">
                    Rückgabe automatisch zur gleichen Uhrzeit.
                  </div>
                  {pickupTimeWish && (
                    <div className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs leading-5 text-amber-100">
                      Uhrzeitwunsch: {pickupTimeWish}
                    </div>
                  )}
                </button>
              </div>

              <h2 className="mt-8 text-xl font-semibold">3. Zahlungsart</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`rounded-2xl border p-4 text-left transition ${
                    paymentMethod === 'cash'
                      ? 'border-amber-400/70 bg-amber-400/[0.08]'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold">Barzahlung</div>
                  <div className="mt-1 text-sm leading-5 text-zinc-500">
                    Mietpreis bei der Abholung vor Ort bezahlen.
                  </div>
                </button>

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="cursor-not-allowed rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left opacity-45"
                >
                  <div className="flex items-center justify-between gap-3 font-semibold">
                    <span>Online bezahlen</span>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                      Demnächst
                    </span>
                  </div>
                  <div className="mt-1 text-sm leading-5 text-zinc-600">
                    Online-Zahlung ist derzeit noch nicht verfügbar.
                  </div>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 text-sm leading-6 text-amber-100">
                <span className="font-semibold">Hinweis:</span> Die Kaution muss immer bar bei
                der Abholung hinterlegt werden – unabhängig von der gewählten Zahlungsart.
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <div className="text-sm font-semibold text-white">Verbindliche Anfrage & Stornierung</div>
                <p className="mt-2 text-xs leading-6 text-zinc-400">
                  Falls Ihre Buchungsanfrage abgelehnt oder storniert wird, informieren wir Sie rechtzeitig. Erhalten Sie keine solche Mitteilung, ist keine weitere Bestätigung erforderlich; Ihre Reservierung gilt mit dem Absenden der Anfrage als verbindlich. Eine kostenlose Stornierung ist bis 24 Stunden vor Mietbeginn möglich. Bei späteren Stornierungen berechnen wir 50 % des vereinbarten Mietpreises als Stornierungsgebühr.
                </p>
              </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-amber-400/15 bg-amber-400/[0.05] p-5 md:p-7 lg:sticky lg:top-6">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                Zusammenfassung
              </div>

              {trailer && imageUrl(trailer) && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  <img
                    src={imageUrl(trailer)}
                    alt={trailer.title}
                    className="aspect-[16/9] w-full object-cover"
                  />
                </div>
              )}

              <h2 className="mt-4 text-2xl font-semibold">
                {trailer?.title || 'Anhänger auswählen'}
              </h2>

              {trailer && (
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Gesamtgewicht', trailer.totalWeight],
                    ['Nutzlast', trailer.payload],
                    ['Ladefläche', trailer.dimensions],
                    ['Führerschein', trailer.licenseClass],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs text-zinc-600">{label}</div>
                      <div className="mt-1 text-zinc-300">{value || '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                <div className="flex justify-between text-zinc-400">
                  <span>Zeitraum</span>
                  <span className="text-right">
                    {startDate && endDate
                      ? `${formatDateDE(startDate)} – ${formatDateDE(endDate)}`
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Mietdauer</span>
                  <span>
                    {days || 0} Tag{days === 1 ? '' : 'e'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Tagespreis</span>
                  <span>{trailer?.pricePerDay || 'Auf Anfrage'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kaution</span>
                  <span>{trailer?.deposit || '—'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Zahlungsart</span>
                  <span>{paymentMethod === 'online' ? 'Online-Zahlung' : 'Barzahlung'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Kaution bezahlen</span>
                  <span>immer bar</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Abholung</span>
                  <span>{pickupTime ? `${pickupTime} Uhr` : '—'}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Rückgabe</span>
                  <span>{pickupTime ? `${pickupTime} Uhr` : '—'}</span>
                </div>
                {pickupTimeWish && (
                  <div className="flex justify-between gap-5 text-zinc-400">
                    <span>Uhrzeitwunsch</span>
                    <span className="max-w-[55%] text-right text-amber-200">{pickupTimeWish}</span>
                  </div>
                )}

                {pricePerDay > 0 && days > 0 && (
                  <div className="flex justify-between border-t border-white/10 pt-4 text-lg font-semibold">
                    <span>Gesamt</span>
                    <span>{total.toFixed(2).replace('.', ',')} €</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
                  {error}
                </div>
              )}

              {!successId && (
                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    type="checkbox"
                    checked={legalAccepted}
                    onChange={(event) => setLegalAccepted(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-amber-400"
                  />
                  <span className="text-xs leading-6 text-zinc-500">
                    Ich habe die{' '}
                    <Link
                      href="/agb"
                      target="_blank"
                      className="font-medium text-amber-300 hover:text-amber-200"
                    >
                      AGB
                    </Link>
                    {' '}und die{' '}
                    <Link
                      href="/mietbedingungen"
                      target="_blank"
                      className="font-medium text-amber-300 hover:text-amber-200"
                    >
                      Mietbedingungen
                    </Link>
                    {' '}gelesen und akzeptiere deren Geltung für meine verbindliche Reservierung.
                  </span>
                </label>
              )}

              {successId ? (
                <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-200">
                  <div className="font-semibold">Mietanfrage wurde gespeichert.</div>
                  <div className="mt-1 text-emerald-100/70">
                    Du findest die Anfrage jetzt in deinem Kundenbereich.
                  </div>
                  {emailStatus === 'sent' && (
                    <div className="mt-3 rounded-lg bg-emerald-300/10 px-3 py-2 text-xs text-emerald-100">
                      Eine Bestätigung wurde an dich gesendet.
                    </div>
                  )}
                  {emailStatus === 'failed' && (
                    <div className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/[0.08] px-3 py-2 text-xs leading-5 text-amber-100">
                      Die Buchung ist gespeichert. Der E-Mail-Versand konnte jedoch nicht abgeschlossen werden.
                    </div>
                  )}
                  <Link
                    href="/konto"
                    className="mt-4 inline-block rounded-lg bg-emerald-400 px-4 py-2 font-semibold text-black"
                  >
                    Zum Kundenbereich
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={
                    saving ||
                    availabilityLoading ||
                    !trailer ||
                    !startDate ||
                    !endDate ||
                    !pickupTime ||
                    !legalAccepted
                  }
                  onClick={createBooking}
                  className="mt-6 w-full rounded-xl bg-amber-400 px-5 py-3.5 font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {availabilityLoading ? 'Verfügbarkeit wird geprüft…' : 'Mietanfrage verbindlich senden'}
                </button>
              )}

              <p className="mt-4 text-xs leading-5 text-zinc-600">
                Der Mietpreis wird derzeit bei der Abholung bar bezahlt. Die Kaution wird ebenfalls
                bei der Abholung in bar hinterlegt. Online-Zahlung folgt zu einem späteren Zeitpunkt.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

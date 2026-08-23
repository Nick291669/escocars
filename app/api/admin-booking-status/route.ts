import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM
const emailReplyTo = process.env.EMAIL_REPLY_TO

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function dateDE(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('de-DE')
}

function money(value: number | null) {
  if (value == null) return 'Auf Anfrage'
  return `${Number(value).toFixed(2).replace('.', ',')} €`
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendApiKey || !emailFrom) throw new Error('E-Mail-Konfiguration fehlt.')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to,
      subject,
      html,
      ...(emailReplyTo ? { reply_to: emailReplyTo } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend Fehler ${response.status}: ${await response.text()}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Supabase-Serverkonfiguration fehlt.' }, { status: 500 })
    }

    const bearer = request.headers.get('authorization') || ''
    const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId : ''
    const status = typeof body?.status === 'string' ? body.status : ''

    if (!bookingId || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }

    const db = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: auth } = await db.auth.getUser(token)
    if (!auth.user) return NextResponse.json({ error: 'Ungültige Sitzung.' }, { status: 401 })

    const { data: adminProfile } = await db
      .from('profiles')
      .select('is_admin')
      .eq('id', auth.user.id)
      .single()

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Keine Adminberechtigung.' }, { status: 403 })
    }

    const { data: booking, error: bookingError } = await db
      .from('bookings')
      .select('id,user_id,trailer_title,start_date,end_date,pickup_time,days,total_price,payment_method')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })
    }

    const { error: updateError } = await db
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookingId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let emailSent = false
    let emailError = ''

    if (status === 'confirmed' || status === 'cancelled') {
      const { data: profile } = await db
        .from('profiles')
        .select('full_name,email')
        .eq('id', booking.user_id)
        .single()

      let customerEmail = profile?.email || ''
      if (!customerEmail) {
        const { data: userResult } = await db.auth.admin.getUserById(booking.user_id)
        customerEmail = userResult.user?.email || ''
      }

      if (customerEmail) {
        const confirmed = status === 'confirmed'
        const time = booking.pickup_time ? `${String(booking.pickup_time).slice(0, 5)} Uhr` : '—'
        const title = confirmed ? 'Deine Mietanfrage wurde bestätigt' : 'Deine Mietanfrage wurde storniert'
        const intro = confirmed
          ? 'Deine Mietanfrage wurde bestätigt. Der Anhänger ist für den angegebenen Zeitraum für dich reserviert.'
          : 'Deine Mietanfrage wurde storniert. Wenn du einen anderen Termin möchtest, kannst du jederzeit eine neue Anfrage stellen.'
        const statusColor = confirmed ? '#a7f3d0' : '#fecaca'
        const statusBg = confirmed ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)'

        const html = `
          <!doctype html>
          <html lang="de">
            <body style="margin:0;background:#070806;font-family:Arial,Helvetica,sans-serif;color:#f4f4ef">
              <div style="max-width:620px;margin:0 auto;padding:32px 18px">
                <div style="border:1px solid #2a2b26;background:#10110e;border-radius:24px;padding:28px">
                  <div style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#fbbf24;font-weight:700">LIWA Anhängervermietung</div>
                  <h1 style="font-size:28px;line-height:1.2;margin:12px 0 10px;color:#fff">${escapeHtml(title)}</h1>
                  <p style="font-size:15px;line-height:1.7;color:#aaa9a2">
                    Hallo ${escapeHtml(profile?.full_name || '')}, ${escapeHtml(intro)}
                  </p>
                  <div style="margin:22px 0;border-radius:14px;padding:14px 16px;background:${statusBg};color:${statusColor};font-weight:700">
                    Status: ${confirmed ? 'Bestätigt' : 'Storniert'}
                  </div>
                  <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:9px 0;color:#8b8b84">Anhänger</td><td style="padding:9px 0;font-weight:600">${escapeHtml(booking.trailer_title)}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Abholung</td><td style="padding:9px 0;font-weight:600">${dateDE(booking.start_date)} · ${time}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Rückgabe</td><td style="padding:9px 0;font-weight:600">${dateDE(booking.end_date)} · ${time}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Mietdauer</td><td style="padding:9px 0;font-weight:600">${booking.days} Tag${booking.days === 1 ? '' : 'e'}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Preis</td><td style="padding:9px 0;font-weight:600">${money(booking.total_price)}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Zahlungsart</td><td style="padding:9px 0;font-weight:600">${booking.payment_method === 'online' ? 'Online-Zahlung' : 'Barzahlung'}</td></tr>
                    <tr><td style="padding:9px 0;color:#8b8b84">Buchungsnummer</td><td style="padding:9px 0;font-weight:600">${booking.id.slice(0,8).toUpperCase()}</td></tr>
                  </table>
                  <div style="margin-top:22px;border:1px solid rgba(251,191,36,.22);background:rgba(251,191,36,.07);border-radius:14px;padding:14px 16px;color:#fde9a9;font-size:13px">
                    Die Kaution wird immer bar bei der Abholung hinterlegt.
                  </div>
                </div>
              </div>
            </body>
          </html>`

        try {
          await sendEmail(customerEmail, `${title} – ${booking.trailer_title}`, html)
          emailSent = true
        } catch (error) {
          emailError = error instanceof Error ? error.message : 'Status-E-Mail fehlgeschlagen.'
          console.error('Status-E-Mail:', error)
        }
      } else {
        emailError = 'Keine Kunden-E-Mail gefunden.'
      }
    }

    return NextResponse.json({ ok: true, emailSent, emailError })
  } catch (error) {
    console.error('admin-booking-status route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Statusänderung fehlgeschlagen.' },
      { status: 500 },
    )
  }
}

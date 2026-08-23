import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM
const emailReplyTo = process.env.EMAIL_REPLY_TO

const pushoverUserKey = process.env.PUSHOVER_USER_KEY
const pushoverAppToken = process.env.PUSHOVER_APP_TOKEN

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

function paymentLabel(method: string) {
  return method === 'online' ? 'Online-Zahlung' : 'Barzahlung'
}

function emailLayout(
  title: string,
  intro: string,
  rows: Array<[string, string]>,
  footer: string,
) {
  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;color:#8b8b84;font-size:14px;vertical-align:top;width:42%">
            ${escapeHtml(label)}
          </td>
          <td style="padding:10px 0;color:#f4f4ef;font-size:14px;font-weight:600;vertical-align:top">
            ${escapeHtml(value)}
          </td>
        </tr>
      `,
    )
    .join('')

  return `
    <!doctype html>
    <html lang="de">
      <body style="margin:0;background:#070806;font-family:Arial,Helvetica,sans-serif;color:#f4f4ef">
        <div style="max-width:620px;margin:0 auto;padding:32px 18px">
          <div style="border:1px solid #2a2b26;background:#10110e;border-radius:24px;padding:28px">
            <div style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#fbbf24;font-weight:700">
              Liwa Anhängervermietung
            </div>
            <h1 style="font-size:28px;line-height:1.2;margin:12px 0 10px;color:#ffffff">${escapeHtml(title)}</h1>
            <p style="font-size:15px;line-height:1.7;color:#aaa9a2;margin:0 0 20px">${escapeHtml(intro)}</p>

            <div style="height:1px;background:#292a25;margin:22px 0"></div>

            <table role="presentation" style="width:100%;border-collapse:collapse">
              ${tableRows}
            </table>

            <div style="margin-top:22px;border:1px solid rgba(251,191,36,.22);background:rgba(251,191,36,.07);border-radius:14px;padding:14px 16px;color:#fde9a9;font-size:13px;line-height:1.6">
              Die Kaution wird immer bar bei der Abholung hinterlegt – unabhängig von der Zahlungsart des Mietpreises.
            </div>

            <p style="margin:24px 0 0;font-size:12px;line-height:1.7;color:#676760">${escapeHtml(footer)}</p>
          </div>
        </div>
      </body>
    </html>
  `
}

async function sendEmail(to: string | string[], subject: string, html: string) {
  if (!resendApiKey || !emailFrom) {
    throw new Error('RESEND_API_KEY oder EMAIL_FROM fehlt.')
  }

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
    const body = await response.text()
    throw new Error(`Resend Fehler ${response.status}: ${body}`)
  }
}

async function sendPushoverNotification(input: {
  title: string
  message: string
  url?: string
}) {
  if (!pushoverUserKey || !pushoverAppToken) {
    throw new Error('PUSHOVER_USER_KEY oder PUSHOVER_APP_TOKEN fehlt.')
  }

  const body = new URLSearchParams()
  body.set('token', pushoverAppToken)
  body.set('user', pushoverUserKey)
  body.set('title', input.title)
  body.set('message', input.message)
  body.set('priority', '0')
  body.set('sound', 'cashregister')

  if (input.url) {
    body.set('url', input.url)
    body.set('url_title', 'Adminbereich öffnen')
  }

  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pushover Fehler ${response.status}: ${errorText}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server-Konfiguration für Supabase fehlt.' },
        { status: 500 },
      )
    }

    const authorization = request.headers.get('authorization')
    const accessToken = authorization?.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : ''

    if (!accessToken) {
      return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const bookingId = typeof body?.bookingId === 'string' ? body.bookingId : ''

    if (!bookingId) {
      return NextResponse.json({ error: 'Buchungs-ID fehlt.' }, { status: 400 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { data: authData, error: authError } = await admin.auth.getUser(accessToken)

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Ungültige Sitzung.' }, { status: 401 })
    }

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select(
        'id,user_id,trailer_title,start_date,end_date,pickup_time,days,total_price,payment_method,status,created_at',
      )
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Buchung nicht gefunden.' }, { status: 404 })
    }

    if (booking.user_id !== authData.user.id) {
      return NextResponse.json(
        { error: 'Kein Zugriff auf diese Buchung.' },
        { status: 403 },
      )
    }

    const [{ data: customer }, { data: admins }] = await Promise.all([
      admin
        .from('profiles')
        .select('full_name,email,phone')
        .eq('id', booking.user_id)
        .single(),
      admin
        .from('profiles')
        .select('full_name,email')
        .eq('is_admin', true)
        .neq('email', ''),
    ])

    const customerEmail = customer?.email || authData.user.email
    const time = booking.pickup_time
      ? `${String(booking.pickup_time).slice(0, 5)} Uhr`
      : '—'
    const bookingNumber = booking.id.slice(0, 8).toUpperCase()

    const bookingRows: Array<[string, string]> = [
      ['Anhänger', booking.trailer_title],
      ['Abholung', `${dateDE(booking.start_date)} · ${time}`],
      ['Rückgabe', `${dateDE(booking.end_date)} · ${time}`],
      ['Mietdauer', `${booking.days} Tag${booking.days === 1 ? '' : 'e'}`],
      ['Mietpreis', money(booking.total_price)],
      ['Zahlungsart', paymentLabel(booking.payment_method)],
      ['Status', 'Mietanfrage eingegangen'],
      ['Buchungsnummer', bookingNumber],
    ]

    let customerEmailSent = false
    let adminEmailSent = false
    let pushSent = false
    const errors: string[] = []

    // Kunden-E-Mail
    if (customerEmail) {
      try {
        const customerHtml = emailLayout(
          'Deine Mietanfrage ist eingegangen',
          `Hallo ${customer?.full_name || 'und vielen Dank'}, wir haben deine Anfrage erhalten. Sie wird jetzt geprüft. Sobald sie bestätigt wurde, siehst du den aktuellen Status auch in deinem Kundenbereich.`,
          bookingRows,
          'Bitte antworte auf diese E-Mail, falls sich bei deinen Angaben etwas geändert hat.',
        )

        await sendEmail(
          customerEmail,
          `Mietanfrage ${bookingNumber} – ${booking.trailer_title}`,
          customerHtml,
        )
        customerEmailSent = true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Kunden-E-Mail fehlgeschlagen'
        errors.push(message)
        console.error('Kunden-E-Mail:', error)
      }
    }

    // Admin-E-Mail
    const adminEmails = Array.from(
      new Set(
        (admins || [])
          .map((item) => item.email)
          .filter((email): email is string => Boolean(email)),
      ),
    )

    if (adminEmails.length > 0) {
      try {
        const adminRows: Array<[string, string]> = [
          ['Kunde', customer?.full_name || '—'],
          ['E-Mail', customerEmail || '—'],
          ['Telefon', customer?.phone || '—'],
          ...bookingRows,
        ]

        const adminHtml = emailLayout(
          'Neue Mietanfrage',
          'Eine neue Buchungsanfrage ist eingegangen. Bitte prüfe sie im Adminbereich und bestätige oder lehne sie ab.',
          adminRows,
          'Diese Nachricht wurde automatisch versendet, weil dein Konto in der Datenbank als Administrator markiert ist.',
        )

        await sendEmail(
          adminEmails,
          `Neue Mietanfrage – ${booking.trailer_title} – ${dateDE(booking.start_date)}`,
          adminHtml,
        )
        adminEmailSent = true
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Admin-E-Mail fehlgeschlagen'
        errors.push(message)
        console.error('Admin-E-Mail:', error)
      }
    }

    // Push-Benachrichtigung
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
      const adminUrl = process.env.ADMIN_URL || (siteUrl ? `${siteUrl}/admin` : undefined)

      const pushMessage = [
        `Kunde: ${customer?.full_name || '—'}`,
        `Telefon: ${customer?.phone || '—'}`,
        `Anhänger: ${booking.trailer_title}`,
        `Abholung: ${dateDE(booking.start_date)} · ${time}`,
        `Rückgabe: ${dateDE(booking.end_date)} · ${time}`,
        `Mietdauer: ${booking.days} Tag${booking.days === 1 ? '' : 'e'}`,
        `Preis: ${money(booking.total_price)}`,
        `Zahlungsart: ${paymentLabel(booking.payment_method)}`,
        `Buchung: ${bookingNumber}`,
      ].join('\n')

      await sendPushoverNotification({
        title: '🔔 Neue Mietanfrage',
        message: pushMessage,
        url: adminUrl,
      })

      pushSent = true
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Push-Benachrichtigung fehlgeschlagen'
      errors.push(message)
      console.error('Pushover:', error)
    }

    return NextResponse.json({
      ok: true,
      emailSent: customerEmailSent && adminEmailSent,
      customerEmailSent,
      adminEmailSent,
      pushSent,
      errors,
    })
  } catch (error) {
    console.error('booking-email route:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Buchungs-Benachrichtigung fehlgeschlagen.',
      },
      { status: 500 },
    )
  }
}

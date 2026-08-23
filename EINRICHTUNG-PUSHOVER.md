# Pushover bei neuer Buchung

Du hast die Keys bereits eingetragen. Prüfe nur, dass sie in der Root-`.env.local` stehen:

```env
PUSHOVER_USER_KEY=DEIN_USER_KEY
PUSHOVER_APP_TOKEN=DEIN_APP_TOKEN
```

Kein `NEXT_PUBLIC_` davor.

Optional:

```env
NEXT_PUBLIC_SITE_URL=https://escocars.com
```

Dann enthält der Push einen Link auf `/admin`.

## Dateien

Diese ZIP enthält nur:

- `app/mieten/page.tsx`
- `app/api/booking-email/route.ts`
- `.env.example`
- `EINRICHTUNG-PUSHOVER.md`

## Ablauf bei einer Buchung

Nach dem Speichern werden unabhängig voneinander versucht:

1. Kunden-E-Mail
2. Admin-E-Mail
3. Pushover Push

Ein Fehler bei Resend verhindert den Push nicht.
Ein Fehler bei Pushover verhindert die E-Mail nicht.
Die Buchung bleibt in jedem Fall gespeichert.

## Push-Inhalt

Die Push-Nachricht enthält:

- Kunde
- Telefonnummer
- Anhänger
- Abholung
- Rückgabe
- Mietdauer
- Preis
- Zahlungsart
- Buchungsnummer

## Neustart

```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

Danach eine neue Testbuchung erstellen.

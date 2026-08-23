# Abholzeit-Popup + Buchungs-E-Mails

## Dateien

Diese ZIP enthält nur neue/geänderte Dateien:

- `app/mieten/page.tsx`
- `app/api/booking-email/route.ts`
- `.env.example`
- `EINRICHTUNG-EMAIL.md`

## 1. Dateien kopieren

Kopiere die Dateien in dein bestehendes Projekt und ersetze `app/mieten/page.tsx`.

Die neue Route gehört exakt hierhin:

`app/api/booking-email/route.ts`

## 2. Abholzeit

Das normale Dropdown ist entfernt.

Beim Klick auf „Abholzeit auswählen“ öffnet sich jetzt ein Popup im gleichen Stil wie der Kalender. Nach Auswahl wird die Zeit direkt übernommen und die Rückgabezeit ist automatisch identisch.

## 3. Resend-Konto anlegen

Für den echten Mailversand wird Resend verwendet.

Du brauchst:
- einen Resend API Key
- eine Absenderadresse
- für echte Kundenmails idealerweise eine bei Resend verifizierte Domain

Es muss kein zusätzliches npm-Paket installiert werden. Die Serverroute verwendet die HTTPS-API direkt.

## 4. Supabase Service Role Key

Die Mailroute muss serverseitig die Buchung, den Kunden und die Admin-Accounts lesen können.

Öffne Supabase und kopiere den `service_role`/Secret Key.

ACHTUNG:
Dieser Key darf ausschließlich in `.env.local` stehen und NIEMALS mit `NEXT_PUBLIC_` beginnen.

## 5. Root-.env.local ergänzen

Deine bestehende `.env.local` im Hauptverzeichnis behalten und zusätzlich ergänzen:

```env
SUPABASE_SERVICE_ROLE_KEY=DEIN_SERVICE_ROLE_KEY

RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=ESCO Anhängervermietung <buchung@deine-domain.de>
EMAIL_REPLY_TO=deine-email@deine-domain.de
```

Deine bereits vorhandenen `NEXT_PUBLIC_SUPABASE_*` und `NEXT_PUBLIC_SANITY_*` Werte bleiben unverändert.

## 6. Admin-E-Mail

Die Admin-Mailadresse kommt NICHT aus dem Code.

Alle Accounts in `public.profiles`, bei denen:

`is_admin = true`

gesetzt ist, erhalten die neue Buchungsanfrage per E-Mail.

Die Spalte `email` muss dafür befüllt sein. Das hast du bereits mit dem vorherigen Admin-Schema eingerichtet.

Du kannst es in Supabase prüfen:

```sql
select id, full_name, email, is_admin
from public.profiles
order by is_admin desc;
```

## 7. Was der Kunde bekommt

Direkt nach erfolgreicher Buchungsanfrage:
- Buchungsnummer
- Anhänger
- Abholdatum + Zeit
- Rückgabedatum + gleiche Zeit
- Mietdauer
- Mietpreis
- Zahlungsart
- Hinweis: Kaution immer bar
- Status: Anfrage eingegangen

## 8. Was der Admin bekommt

Zusätzlich:
- Name des Kunden
- E-Mail
- Telefonnummer
- alle Buchungsdaten

## 9. Neustart

Nach Änderung der `.env.local`:

```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

## Wichtig für Vercel

Später müssen diese drei Server-Secrets auch in Vercel unter Project Settings -> Environment Variables eingetragen werden:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Optional:
- `EMAIL_REPLY_TO`

Der Service Role Key und Resend Key dürfen niemals in GitHub committed werden.

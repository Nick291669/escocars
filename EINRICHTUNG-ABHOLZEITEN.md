# LIWA – Abholzeiten je Anhänger

Geändert / neu:
- `app/admin/page.tsx`
- `app/mieten/page.tsx`
- `app/api/booking-email/route.ts`
- `supabase/abholzeiten-pro-anhaenger.sql`

## Adminbereich
Es gibt jetzt einen Bereich `Verfügbare Zeiten je Anhänger`.

Dort erscheinen die aktuell veröffentlichten Sanity-Anhänger. Für jeden Anhänger kannst du
08:00 bis 17:00 einzeln aktivieren oder deaktivieren und anschließend speichern.

Die Einstellung ist absichtlich anhängerbezogen und nicht tagesbezogen.

## /mieten
Im Abholzeit-Popup werden nur noch die für den ausgewählten Anhänger freigegebenen festen
Abholzeiten angezeigt.

Zusätzlich gibt es ein optionales Feld `Uhrzeitwunsch`.

Der Kunde sieht den Hinweis, dass:
- der Uhrzeitwunsch nicht automatisch bestätigt ist,
- LIWA den Wunsch separat prüft,
- der Kunde eine eigene Rückmeldung erhält,
- bei Bedarf eine andere Uhrzeit vorgeschlagen werden kann,
- bis dahin die normal ausgewählte feste Abholzeit maßgeblich bleibt.

Der Wunsch wird in Supabase gespeichert, im Adminbereich bei der Buchung angezeigt und
in der Buchungs-E-Mail mit aufgeführt.

## Installation
1. Dateien aus der ZIP übernehmen.
2. `supabase/abholzeiten-pro-anhaenger.sql` vollständig im Supabase SQL Editor ausführen.
3. Danach:
   `Ctrl + C`
   `npm run dev`
4. Bei Vercel anschließend neu deployen.

Wichtig:
Das SQL baut auf deinem aktuellen Papierkorb-System auf und erwartet die bereits vorhandene
Spalte `bookings.deleted_at`.

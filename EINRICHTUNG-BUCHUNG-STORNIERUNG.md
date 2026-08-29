# LIWA Buchungshinweis, Stornierung & Kontakt

Geändert:
- `app/page.tsx`
- `app/mieten/page.tsx`
- `app/konto/page.tsx`
- `public/liwa-standort-vorschau.png`
- `supabase/stornierung-24h.sql`

## Neuer Buchungshinweis

Der Text wurde sprachlich korrigiert zu:

Falls Ihre Buchungsanfrage abgelehnt oder storniert wird, informieren wir Sie rechtzeitig. Erhalten Sie keine solche Mitteilung, ist keine weitere Bestätigung erforderlich; Ihre Reservierung gilt mit dem Absenden der Anfrage als verbindlich. Eine kostenlose Stornierung ist bis 24 Stunden vor Mietbeginn möglich. Bei späteren Stornierungen berechnen wir 50 % des vereinbarten Mietpreises als Stornierungsgebühr.

Er erscheint:
- auf der Startseite
- in jedem Anhänger-Detailfenster
- auf `/mieten`

## Kundenbereich

Für aktive Anfragen/Reservierungen gilt:
- mindestens 24 Stunden vor Mietbeginn: Kunde kann selbst kostenlos stornieren
- weniger als 24 Stunden vorher: kein Selbst-Storno-Button mehr
- stattdessen Kontakt über `01517 0387967`
- Hinweis auf mögliche 50-%-Stornierungsgebühr

Die 24-Stunden-Regel wird zusätzlich in Supabase geprüft und kann nicht nur über die Oberfläche umgangen werden.

## Kontakt auf der Startseite

Telefon:
`01517 0387967`

Adresse:
`Am freien Feld 18, 73669 Lichtenwald`

Das mitgelieferte Standortbild wird oberhalb von Adresse und Telefonnummer angezeigt.

## Einrichtung

1. Dateien aus der ZIP übernehmen.
2. `supabase/stornierung-24h.sql` vollständig im Supabase SQL Editor ausführen.
3. Dev-Server neu starten.

```powershell
Ctrl + C
npm run dev
```

Hinweis: Die Formulierung stellt eine von dir gewünschte Vertrags-/Stornierungsregel dar. Vor dem produktiven Einsatz sollte sie mit deinen AGB/Mietbedingungen konsistent sein.

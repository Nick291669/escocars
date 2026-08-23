# Testdaten löschen – LIWA Buchhaltung

Diese ZIP enthält nur:

- `app/admin/buchhaltung/page.tsx`
- `supabase/buchhaltung-testloeschen.sql`

## 1. Seite ersetzen
`app/admin/buchhaltung/page.tsx` ersetzen.

## 2. SQL ergänzen
Supabase → SQL Editor → gesamten Inhalt von:

`supabase/buchhaltung-testloeschen.sql`

ausführen.

Das bestehende `buchhaltung.sql` musst du nicht erneut ausführen.

## Danach verfügbar

### Kassenbuch
Jeder Eintrag hat zusätzlich:
`Test löschen`

Das löscht den Datensatz endgültig.

### Stornierte Buchungen
Unten im Buchhaltungsbereich gibt es einen neuen Abschnitt:
`Stornierte Testbuchungen löschen`

Dort können ausschließlich Buchungen mit Status `cancelled` endgültig gelöscht werden.
Zugehörige Kautions- und Kassenbuch-Testdaten werden dabei ebenfalls entfernt.

## Wichtig
Die Funktion ist für deine aktuelle Entwicklungsphase gedacht.

Sobald LIWA produktiv echte Vermietungen erfasst, solltest du echte Buchhaltungsdaten nicht einfach löschen. Dafür ist weiterhin `Korrigieren` vorgesehen, damit Änderungen nachvollziehbar bleiben.

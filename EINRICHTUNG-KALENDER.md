# ESCO – Kalender & Verfügbarkeit

Diese ZIP enthält nur:

- `app/mieten/page.tsx`
- `supabase/verfuegbarkeit.sql`

## 1. Dateien kopieren

`app/mieten/page.tsx` in deinem bestehenden Projekt ersetzen.

`supabase/verfuegbarkeit.sql` zusätzlich in deinen bestehenden `supabase`-Ordner kopieren.

## 2. Supabase aktualisieren

Supabase → SQL Editor öffnen.

Den kompletten Inhalt von:

`supabase/verfuegbarkeit.sql`

einfügen und auf **Run** klicken.

Das ist wichtig, weil der Kalender seine roten/belegten Tage aus diesen beiden Funktionen bekommt:

- `get_unavailable_trailer_ids`
- `get_trailer_booked_dates`

## 3. Server neu starten

```powershell
Ctrl + C
npm run dev
```

Falls Next.js cached:

```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

## Was jetzt funktioniert

- Jeder Anhänger hat in der Mietauswahl sein Sanity-Bild.
- Der ausgewählte Anhänger hat auch in der Zusammenfassung ein großes Bild.
- Der Zeitraum wird über einen eigenen Kalender gewählt.
- Grün = verfügbar.
- Rot = bereits reserviert/gebucht.
- Nach kompletter Datumsauswahl werden belegte Anhänger sofort aus der Auswahl entfernt.
- Der Kunde muss nicht erst auf „Buchen“ klicken, um die Verfügbarkeit zu erfahren.
- Die endgültige Buchungsfunktion prüft den Zeitraum trotzdem ein zweites Mal, damit parallele Buchungen abgesichert bleiben.

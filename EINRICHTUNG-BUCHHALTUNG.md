# LIWA Buchhaltung – Einrichtung

## Enthalten
- `app/admin/page.tsx` – Link „Buchhaltung“
- `app/admin/buchhaltung/page.tsx` – kompletter Buchhaltungsbereich
- `supabase/buchhaltung.sql` – Datenbanktabellen, Rechte und Funktionen

## 1. Dateien kopieren
Die Ordnerstruktur aus der ZIP direkt in dein aktuelles Projekt übernehmen.

## 2. SQL einmal ausführen
Supabase → SQL Editor → New query → gesamten Inhalt aus:

`supabase/buchhaltung.sql`

einfügen → Run.

## 3. Neustarten
```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

Danach im Adminbereich oben auf **Buchhaltung**.

## Was enthalten ist
- Barzahlung einer bestätigten Vermietung mit einem Klick erfassen
- automatische eindeutige Belegnummer `LIWA-KASSE-JAHR-000001`
- Betriebsausgaben
- Bankeinzahlungen (Kasse → Bank, kein doppelter Umsatz)
- Privatentnahmen
- Privateinlagen
- Kaution separat vom Mietumsatz
- Rückgabe einer Kaution
- rechnerischer Kassenbestand
- Jahresumsatz / Ausgaben / Überschuss
- Korrekturbuchungen statt Löschen
- Jahresfilter
- CSV-Export für Excel/Steuerberater
- druckbarer Jahresbericht / „Als PDF speichern“ über den Browser

## Wichtig zum Ablauf
Bei Abholung und Barzahlung:
1. Admin → Buchhaltung
2. bei der Buchung `Barzahlung erhalten`
3. der Mietpreis wird als Bareinnahme verbucht

Wenn du Bargeld aufs Geschäftskonto bringst:
1. `+ Eintrag`
2. `Bankeinzahlung`
3. Betrag und Referenz des Einzahlungsbelegs eintragen

Wenn du Geld privat entnimmst:
`+ Eintrag` → `Privatentnahme`

Bei einer betrieblichen Ausgabe:
`+ Eintrag` → `Betriebsausgabe`
und den Originalbeleg separat aufbewahren.

## Steuerlicher Hinweis
Der Export ist eine Buchhaltungsvorbereitung. Er ersetzt nicht automatisch alle Steuererklärungen, Belege, Rechnungsanforderungen oder Aufbewahrungspflichten. Vor produktiver Nutzung sollte insbesondere die konkrete Kassenführung einmal mit Steuerberatung abgestimmt werden.

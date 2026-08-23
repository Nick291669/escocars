# LIWA Admin + Buchhaltungs-Popups

Geändert:
- `app/admin/page.tsx`
- `app/admin/buchhaltung/page.tsx`

## Adminbereich
Der Button `Buchhaltung` ist wieder oben im Adminbereich vorhanden.

## Buchhaltung
Unter der Jahresübersicht gibt es jetzt vier große Schnellerfassungs-Buttons:

- Ausgabe erfassen
- Geld privat entnehmen
- Privateinlage
- Bankeinzahlung

Jeder Button öffnet ein eigenes LIWA-Popup im gleichen dunklen Design wie Kalender und Abholzeit.

Die vorhandene Datenbanklogik bleibt unverändert, deshalb musst du diesmal kein neues SQL ausführen.

Nach dem Kopieren reicht:
`Ctrl + C`
`npm run dev`

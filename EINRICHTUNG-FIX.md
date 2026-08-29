# LIWA Rechtstexte FIX

Dieses Paket korrigiert die fehlende Integration aus dem vorherigen Paket.

## Jetzt sichtbar
- Footer auf `/`: Impressum, Datenschutz, AGB, Mietbedingungen sind echte Links.
- `/impressum`
- `/datenschutz`
- `/agb`
- `/mietbedingungen`
- `/mieten`: Online bezahlen ist deaktiviert und mit `Demnächst` markiert.
- `/mieten`: sichtbare Pflicht-Checkbox für AGB + Mietbedingungen.
- Buchung kann erst abgesendet werden, wenn die Checkbox aktiviert ist.
- Barzahlung ist technisch die einzige aktive Zahlungsart.

## Wichtig beim Kopieren
Nicht alle Dateien einfach lose in den Projekt-Hauptordner legen.

Die Ordnerstruktur MUSS exakt erhalten bleiben:

components/LegalPage.tsx
app/page.tsx
app/mieten/page.tsx
app/impressum/page.tsx
app/datenschutz/page.tsx
app/agb/page.tsx
app/mietbedingungen/page.tsx

Wenn du die ZIP entpackst, kopiere die Ordner `app` und `components` in das Projekt und bestätige das Überschreiben der vorhandenen Dateien.

Danach:
npm run dev

Für Vercel:
git add .
git commit -m "Fix Rechtstexte Integration"
git push

Danach prüfen:
/
 /impressum
 /datenschutz
 /agb
 /mietbedingungen
 /mieten

# Supabase: Login, Registrierung und Buchungen einrichten

## Wichtig bei "Failed to fetch"

Der Fehler entsteht fast immer, wenn die Website noch keine gültige Supabase-Verbindung hat. Die neue Version zeigt dafür jetzt eine verständliche Fehlermeldung statt nur "Failed to fetch".

## 1. Supabase-Projekt

Erstelle auf supabase.com ein Projekt und öffne im Dashboard **Project Settings -> API**.

## 2. `.env.local` im Hauptordner ergänzen

Deine vorhandene `.env.local` NICHT löschen. Ergänze dort:

NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=DEIN_PUBLISHABLE_KEY

Falls dein Projekt noch den älteren Anon Key anzeigt, geht alternativ:

NEXT_PUBLIC_SUPABASE_ANON_KEY=DEIN_ANON_KEY

Danach den laufenden Dev-Server komplett beenden und neu starten:

npm run dev

Next.js liest Änderungen an den Umgebungsvariablen sonst unter Umständen nicht korrekt neu ein.

## 3. Datenbank aktualisieren

Öffne in Supabase den **SQL Editor** und führe den kompletten Inhalt von `supabase/schema.sql` aus.

Das Skript darf auch ausgeführt werden, wenn du die vorherige Version bereits eingerichtet hast. Es ergänzt die neue Spalte `pickup_time` und ersetzt die alte Buchungsfunktion.

## 4. Abholzeiten ändern

Die aktuell angebotenen Zeiten stehen in:

app/mieten/page.tsx

Dort findest du die `<option>`-Einträge von 08:00 bis 17:00 Uhr. Du kannst später einfach Zeiten entfernen oder weitere hinzufügen. Die vom Kunden gewählte Uhrzeit wird jetzt als eigenes Datenbankfeld gespeichert und im Kundenbereich angezeigt.

## 5. Vercel

Wenn du die Seite auf Vercel veröffentlichst, müssen dieselben Supabase-Variablen auch unter **Project Settings -> Environment Variables** in Vercel eingetragen werden. Danach erneut deployen.

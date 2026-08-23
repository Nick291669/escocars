# Einmalige Einrichtung für Login und Buchungen

Die Dateien in diesem Paket enthalten den vollständigen Code für Registrierung, Login, Mietanfrage und Kundenbereich. Damit Accounts und Buchungen dauerhaft gespeichert werden, braucht das Projekt ein Supabase-Projekt.

## 1. Supabase-Projekt erstellen

Auf supabase.com ein neues Projekt erstellen.

## 2. Datenbank einrichten

Im Supabase Dashboard den **SQL Editor** öffnen. Den kompletten Inhalt der Datei `supabase/schema.sql` einfügen und einmal ausführen.

Das Skript erstellt automatisch:
- Kundenprofile
- Buchungstabelle
- Sicherheitsregeln (RLS)
- automatische Profilerstellung bei Registrierung
- Buchungsfunktion mit Schutz gegen Doppelbuchungen

## 3. Umgebungsvariablen ergänzen

Die eigene bestehende `.env.local` NICHT löschen. Nur diese beiden Werte zusätzlich eintragen (Werte im Supabase Dashboard unter Project Settings / API):

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

Eine Vorlage liegt als `.env.example` bei.

## 4. Abhängigkeit installieren

Nachdem die Dateien in das bestehende Projekt kopiert wurden, im VS-Code-Terminal einmal ausführen:

npm install

Danach:

npm run dev

## 5. E-Mail-Bestätigung

Supabase aktiviert bei neuen Projekten normalerweise die E-Mail-Bestätigung. Nach einer Registrierung bestätigt der Kunde seine E-Mail und kann sich anschließend einloggen. Für lokale Tests kann diese Einstellung im Supabase-Dashboard unter Authentication geändert werden.

## Enthaltene Funktionen

- `/registrieren` – Kundenkonto erstellen
- `/login` – anmelden
- `/mieten` – Anhänger + Zeitraum auswählen und Mietanfrage speichern
- `/konto` – eigene Mieten sehen und offene Anfragen stornieren
- Startseitenbuttons führen auf die echten Seiten
- gewählte Start-/Enddaten werden zur Mietseite übernommen
- gewählter Anhänger aus der Detailansicht wird zur Mietseite übernommen
- Doppelbuchungen für denselben Anhänger und überschneidende Zeiträume werden serverseitig verhindert
- noch keine Online-Zahlung

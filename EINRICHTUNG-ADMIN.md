# Admin-Einrichtung

1. Kopiere die Dateien aus dieser ZIP in dein Projekt und ersetze die vorhandenen Dateien.
2. Öffne Supabase -> SQL Editor.
3. Führe den kompletten Inhalt von `supabase/schema.sql` aus.
4. Logge dich mit deinem eigenen normalen Website-Account ein.
5. Setze diesen Account einmalig zum Admin:

```sql
update public.profiles
set is_admin = true
where lower(email) = lower('DEINE-LOGIN-EMAIL');
```

6. Danach erreichst du den Adminbereich unter `/admin`.

Die Zahlungsart wird ab jetzt in jeder Buchung gespeichert:
- `cash` = Barzahlung
- `online` = Online-Zahlung (Stripe wird später angebunden)

Die Kaution wird in der Oberfläche immer als Barzahlung ausgewiesen.

## Handy-Benachrichtigungen

Für den nächsten Schritt empfehle ich Telegram:
- kostenlos
- sofortige Push-Nachricht aufs Handy
- funktioniert auch bei geschlossenem Adminbereich
- Bot-Token bleibt nur serverseitig in `.env.local` / Vercel

Später kann eine neue Buchung z. B. senden:

Neue Mietanfrage
Motorradanhänger
23.08.2026 16:00 -> 24.08.2026 16:00
Max Mustermann
+49 ...
Barzahlung
39,00 EUR

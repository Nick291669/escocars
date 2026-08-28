# LIWA Startseite – Verfügbare Flotte

Geändert wurde nur:
- `app/page.tsx`

## Neuer Ablauf auf der Startseite

1. Kunde wählt Abhol- und Rückgabedatum.
2. Klick auf `Verfügbarkeit prüfen`.
3. Die Startseite prüft die Buchungen in Supabase.
4. Die Seite scrollt automatisch zu `Unsere Flotte`.
5. Dort werden nur Anhänger angezeigt, die im gewählten Zeitraum frei sind.
6. `Details` öffnet weiterhin die Anhänger-Details.
7. `Diesen Anhänger mieten` öffnet erst danach `/mieten` und übernimmt den gewählten Zeitraum.

Ohne ausgewählten Zeitraum werden wie bisher alle Anhänger angezeigt.

Der Kalender auf der Startseite zeigt bewusst keine roten/grünen Belegungstage mehr. Die ausführliche Belegungsanzeige auf `/mieten` bleibt unverändert.

## Voraussetzung

Die bereits vorhandene Supabase-Funktion:

`get_unavailable_trailer_ids`

muss vorhanden sein. Diese kam mit `supabase/verfuegbarkeit.sql`.

Kein neues SQL erforderlich, wenn diese Funktion bereits bei dir läuft.

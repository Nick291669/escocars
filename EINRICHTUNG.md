# Startseiten-Kalender

Nur `app/page.tsx` wurde geändert.

- Der Browser-Standardkalender auf der Startseite wurde durch einen eigenen Kalender im Stil von `/mieten` ersetzt.
- Abholung und Rückgabe werden im selben Kalender ausgewählt.
- Vergangene Tage sind deaktiviert, auswählbare Tage grün und der gewählte Zeitraum gelb markiert.
- In den Anhänger-Details wurden beide Datumsfelder entfernt.
- Dort gibt es nur noch `Diesen Anhänger mieten`; der Button öffnet `/mieten` mit dem gewählten Anhänger.

Datei ersetzen und danach bei laufendem Dev-Server einfach neu laden. Falls nötig:
`Ctrl + C` und `npm run dev`.

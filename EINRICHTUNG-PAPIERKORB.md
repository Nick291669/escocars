# LIWA Buchhaltung – Papierkorb

## Neue Struktur
Oben bei bestätigten Vermietungen:
- Bar bezahlt
- Online bezahlt
- Storniert

Bar/Online -> Kassenbuch.
Storniert -> Papierkorb.

Im Kassenbuch:
- Korrigieren
- Papierkorb

Im Papierkorb:
- Mietanfragen wiederherstellen -> erscheinen wieder bei Offene Zahlungen.
- Manuelle Kassenbucheinträge wiederherstellen -> erscheinen wieder im Kassenbuch.

## Einrichtung
1. Dateien aus ZIP übernehmen.
2. `supabase/buchhaltung-papierkorb.sql` komplett im Supabase SQL Editor ausführen.
3. Dev-Server neu starten.

## Hinweis zu Stripe
Wenn später eine echte Stripe-Zahlung bereits ausgeführt wurde, verschiebt dieser Papierkorb nur deine interne LIWA-Buchhaltung. Eine echte Stripe-Rückerstattung erfolgt dadurch nicht automatisch.

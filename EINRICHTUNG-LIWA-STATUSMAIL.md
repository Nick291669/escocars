# LIWA Branding + Status-E-Mails

Enthalten:
- app/page.tsx
- app/layout.tsx
- app/mieten/page.tsx
- app/admin/page.tsx
- app/api/booking-email/route.ts
- app/api/admin-booking-status/route.ts
- sanity/sanity.config.ts

Neu:
- Auf `/mieten` sieht der Kunde nach Erfolg nur noch: „Eine Bestätigung wurde an dich gesendet.“
- Beim Bestätigen im Adminbereich bekommt der Kunde automatisch eine Bestätigungs-E-Mail.
- Beim Ablehnen/Stornieren bekommt der Kunde automatisch eine Storno-E-Mail.
- `completed` verschickt keine zusätzliche Kundenmail.
- Sichtbares ESCO-Branding wurde in den aktuellen betroffenen Dateien auf LIWA geändert.
- Die Domain `escocars.com` bleibt technisch unverändert.

Kein neues SQL nötig.

Nach dem Kopieren:
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev

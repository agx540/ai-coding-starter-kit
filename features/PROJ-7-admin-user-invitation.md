# PROJ-7: Admin - User-Einladung per Email

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Einladungstoken-Validierung bei Registrierung

## Beschreibung
Admins können Nutzer per Email zum Voting Board einladen. Eine Einladung generiert einen einmaligen Token-Link, der per Email versendet wird. Nur mit gültigem Token kann sich ein Nutzer registrieren.

## User Stories
- Als Admin möchte ich Nutzer per Email einladen, um den Zugang zum Board zu kontrollieren
- Als Admin möchte ich eine Übersicht aller Einladungen sehen (ausstehend, angenommen, abgelaufen)
- Als Admin möchte ich abgelaufene Einladungen erneut senden können
- Als eingeladener Nutzer möchte ich über den Einladungslink direkt zur Registrierung gelangen

## Acceptance Criteria
- [ ] Admin-Formular: Email-Adresse eingeben und Einladung versenden
- [ ] System generiert einmaligen Einladungstoken (UUID)
- [ ] Email wird mit Registrierungslink versendet (via Supabase Edge Function oder Email-Provider)
- [ ] Einladungstoken ist 7 Tage gültig
- [ ] Registrierungsseite validiert Token und zeigt Email vorausgefüllt an
- [ ] Nach erfolgreicher Registrierung wird Token als "verwendet" markiert
- [ ] Admin sieht Einladungs-Liste: Email, Status (ausstehend/angenommen/abgelaufen), Datum
- [ ] Admin kann abgelaufene Einladung erneut senden (neuer Token)
- [ ] Einladung an bereits registrierte Email → Fehlermeldung

## Edge Cases
- Email-Versand schlägt fehl → Fehlermeldung, Einladung bleibt als "ausstehend"
- Nutzer klickt abgelaufenen Link → Hinweis "Einladung abgelaufen, bitte Admin kontaktieren"
- Nutzer versucht Token mehrfach zu verwenden → Hinweis "Einladung bereits verwendet"
- Admin lädt gleiche Email zweimal ein → Fehlermeldung "Einladung bereits gesendet" (oder Option: erneut senden)
- Admin löscht Einladung bevor Nutzer sich registriert → Token wird ungültig

## Technische Anforderungen
- Supabase Tabelle `invitations` (id, email, token, status, created_at, expires_at, used_at)
- RLS: Nur Admins können Einladungen erstellen und einsehen
- Email-Versand via Supabase Auth Invite oder Edge Function mit Resend/SendGrid
- Token: UUID v4, gehashed in DB gespeichert

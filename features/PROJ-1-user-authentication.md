# PROJ-1: User Authentication

## Status: 🔵 Planned

## Beschreibung
Eigenständiges Authentifizierungssystem für die Voting Board App mit Email + Passwort. Das System ist vollständig losgelöst von der bestehenden Aktienportfolio App und nutzt ein eigenes Supabase-Projekt.

## User Stories
- Als eingeladener Nutzer möchte ich mich mit Email und Passwort registrieren, um Zugang zum Voting Board zu erhalten
- Als registrierter Nutzer möchte ich mich einloggen, um meine Ideen und Votes zu verwalten
- Als registrierter Nutzer möchte ich mich ausloggen, um meine Session sicher zu beenden
- Als Nutzer möchte ich mein Passwort zurücksetzen können, falls ich es vergessen habe
- Als System möchte ich sicherstellen, dass nur eingeladene Nutzer sich registrieren können

## Acceptance Criteria
- [ ] Registrierung nur mit gültigem Einladungstoken möglich
- [ ] Email-Validierung (Format + Einmaligkeit)
- [ ] Passwort-Mindestanforderungen (min. 8 Zeichen)
- [ ] Login mit Email + Passwort
- [ ] Logout beendet Session serverseitig
- [ ] Passwort-Reset per Email-Link
- [ ] Session bleibt nach Browser-Reload erhalten (Supabase Auth Session)
- [ ] Geschützte Routen leiten nicht-eingeloggte Nutzer zum Login um
- [ ] Supabase Auth als Backend (eigenes Supabase-Projekt)

## Edge Cases
- Registrierung mit bereits verwendeter Email → Fehlermeldung "Email bereits registriert"
- Registrierung ohne/mit ungültigem Einladungstoken → Zugang verweigert
- Abgelaufener Einladungstoken → Fehlermeldung mit Hinweis, neuen Token anzufordern
- Passwort-Reset für nicht existierende Email → Generische Meldung (kein Hinweis ob Email existiert)
- Mehrfacher fehlgeschlagener Login → Rate Limiting (5 Versuche pro Minute)
- Session-Timeout nach Inaktivität → Automatischer Logout nach 7 Tagen

## Technische Anforderungen
- Supabase Auth für Session-Management
- Row Level Security (RLS) auf allen Tabellen
- HTTPS only
- Passwort-Hashing durch Supabase (bcrypt)

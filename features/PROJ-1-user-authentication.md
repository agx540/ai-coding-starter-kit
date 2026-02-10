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

## Tech-Design (Solution Architect)

### Component-Struktur

```
App
├── Layout (gemeinsamer Rahmen)
│   └── Auth-Guard (prüft ob eingeloggt)
│
├── Login-Seite (/login)
│   ├── Logo / App-Name
│   ├── Email-Eingabefeld
│   ├── Passwort-Eingabefeld
│   ├── "Einloggen" Button
│   ├── "Passwort vergessen?" Link
│   └── Fehlermeldungen (z.B. "Falsche Zugangsdaten")
│
├── Registrierungs-Seite (/register)
│   ├── Logo / App-Name
│   ├── Einladungstoken-Eingabe (oder aus URL übernommen)
│   ├── Email-Eingabefeld
│   ├── Passwort-Eingabefeld (mit Mindestanforderung: 8 Zeichen)
│   ├── Passwort bestätigen-Eingabefeld
│   ├── "Registrieren" Button
│   └── Fehlermeldungen (z.B. "Email bereits registriert", "Token ungültig")
│
├── Passwort-Vergessen-Seite (/forgot-password)
│   ├── Email-Eingabefeld
│   ├── "Reset-Link senden" Button
│   └── Bestätigungsnachricht ("Falls ein Konto existiert, wurde eine Email gesendet")
│
├── Passwort-Zurücksetzen-Seite (/reset-password)
│   ├── Neues Passwort-Eingabefeld
│   ├── Passwort bestätigen-Eingabefeld
│   └── "Passwort ändern" Button
│
└── Geschützte Seiten (z.B. Dashboard / Voting Board)
    └── Header mit Logout-Button
```

### Daten-Model

```
Benutzer (wird von Supabase Auth automatisch verwaltet):
- Eindeutige ID
- Email-Adresse
- Verschlüsseltes Passwort (automatisch von Supabase)
- Erstellungszeitpunkt
- Letzte Anmeldung

Einladungstoken:
- Eindeutige ID
- Token-Wert (zufällig generiert)
- Erstellt von (Admin-ID)
- Erstellungszeitpunkt
- Ablaufdatum (z.B. 7 Tage nach Erstellung)
- Status (offen / eingelöst / abgelaufen)
- Eingelöst von (Benutzer-ID, sobald registriert)

Gespeichert in: Supabase (PostgreSQL-Datenbank + Supabase Auth)
```

### Seitenfluss (User Journey)

```
Neuer Nutzer erhält Einladungslink per Email
        ↓
Registrierungs-Seite (Token wird geprüft)
        ↓
    Konto erstellt → automatisch eingeloggt
        ↓
    → Weiterleitung zum Voting Board

Bestehender Nutzer:
    Login-Seite → Einloggen → Voting Board

Passwort vergessen:
    Login → "Passwort vergessen?" → Email eingeben → Reset-Link per Email → Neues Passwort setzen

Nicht eingeloggt + geschützte Seite:
    → Automatische Weiterleitung zur Login-Seite
```

### Sicherheitskonzept

```
- Nur eingeladene Nutzer können sich registrieren (Token-System)
- Nach 5 fehlgeschlagenen Login-Versuchen → 1 Minute Sperre
- Sitzung läuft nach 7 Tagen Inaktivität automatisch ab
- Alle Datenbank-Tabellen sind durch Row Level Security geschützt
  (= Nutzer sehen nur ihre eigenen Daten)
- Passwort-Reset zeigt NICHT ob eine Email registriert ist
  (Schutz vor Email-Enumeration)
```

### Tech-Entscheidungen

```
Warum Supabase Auth statt eigener Auth-Lösung?
→ Sichere Passwort-Verschlüsselung out-of-the-box
→ Session-Management bereits eingebaut
→ Email-Versand für Passwort-Reset inklusive
→ Row Level Security für Datenschutz

Warum Einladungstoken-System?
→ Feature Spec erfordert: "Nur eingeladene Nutzer"
→ Admin erstellt Token, Nutzer löst ihn bei Registrierung ein
→ Einfach zu verwalten, sicher, skalierbar

Warum Next.js Middleware für Route-Schutz?
→ Server-seitige Prüfung (nicht umgehbar im Browser)
→ Schnelle Weiterleitung zum Login ohne Seiten-Flackern

Warum react-hook-form + zod für Formulare?
→ Bereits im Projekt installiert
→ Validierung (Email-Format, Passwort-Länge) einfach umsetzbar
```

### Dependencies

```
Bereits installiert (keine neuen Packages nötig):
- @supabase/supabase-js (Supabase Client)
- react-hook-form (Formular-Handling)
- @hookform/resolvers (Validierung)
- zod (Validierungs-Regeln)

Neu benötigt:
- @supabase/ssr (Server-seitige Auth für Next.js App Router)
```

### Supabase-Setup (was im Supabase Dashboard konfiguriert werden muss)

```
1. Neues Supabase-Projekt erstellen
2. Auth aktivieren (Email + Passwort Provider)
3. Tabelle "invitations" anlegen (für Einladungstoken)
4. Row Level Security aktivieren
5. Email-Templates anpassen (Passwort-Reset, Willkommen)
6. URL-Konfiguration (Redirect URLs für Passwort-Reset)
```

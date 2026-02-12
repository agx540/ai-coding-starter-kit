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

## Tech-Design (Solution Architect)

### Bestandsaufnahme: Was existiert bereits?

~60% der Backend-Infrastruktur ist bereits gebaut (aus PROJ-1):

| Baustein | Status |
|---|---|
| `invitations` Tabelle (Token, Ersteller, Ablaufdatum) | ✅ Existiert |
| Token-Validierung bei Registrierung | ✅ Existiert |
| Token-Einlösung (atomar, race-condition-sicher) | ✅ Existiert |
| API: Einladung erstellen (POST /api/invitations) | ✅ Existiert |
| API: Einladungen auflisten (GET /api/invitations) | ✅ Existiert |
| API: Einladung löschen (DELETE /api/invitations/[id]) | ✅ Existiert |
| Registrierungsseite akzeptiert Token via URL | ✅ Existiert |
| Admin-Rollen-System (profiles.role) | ✅ Existiert |
| **Email-Feld in Einladungstabelle** | ❌ Fehlt |
| **Admin-UI (Einladungs-Verwaltung)** | ❌ Fehlt |
| **Email-Versand** | ❌ Fehlt |
| **Erneut-Senden Funktion** | ❌ Fehlt |
| **Duplikat-Prüfung (bereits eingeladen/registriert)** | ❌ Fehlt |

### Component-Struktur

```
Admin-Bereich (/admin/invitations)  ← Neue Seite
├── Header (existiert bereits, wird wiederverwendet)
├── Einladungs-Formular
│   ├── Email-Eingabefeld
│   └── "Einladung senden" Button
├── Einladungs-Liste (Tabelle)
│   ├── Spalten: Email | Status | Gesendet am | Aktion
│   ├── Status-Anzeige
│   │   ├── 🟡 "Ausstehend" (gesendet, noch nicht eingelöst)
│   │   ├── ✅ "Angenommen" (Nutzer hat sich registriert)
│   │   └── 🔴 "Abgelaufen" (7 Tage vorbei, nicht eingelöst)
│   └── Aktions-Buttons
│       ├── "Erneut senden" (nur bei abgelaufenen)
│       └── "Löschen" (bei ausstehenden/abgelaufenen)
└── Leerer Zustand ("Noch keine Einladungen versendet")
```

Navigation zum Admin-Bereich:
```
Header (existiert)
└── User-Menü (existiert)
    └── NEU: "Einladungen verwalten" Link (nur für Admins sichtbar)
```

### Daten-Model

**Erweiterung der bestehenden `invitations` Tabelle:**

Aktuell gespeichert:
- Eindeutige ID
- Token (64-Zeichen, automatisch generiert)
- Erstellt von (Admin-ID)
- Erstellt am
- Läuft ab am (Standard: 7 Tage)
- Eingelöst von (Nutzer-ID, wenn registriert)
- Eingelöst am

Neu hinzuzufügen:
- **Email-Adresse** des Eingeladenen (benötigt für Liste und Duplikat-Prüfung)

Status wird berechnet (nicht extra gespeichert):
- "Ausstehend" = eingelöst_von ist leer UND Ablaufdatum in der Zukunft
- "Angenommen" = eingelöst_von ist gefüllt
- "Abgelaufen" = eingelöst_von ist leer UND Ablaufdatum in der Vergangenheit

### Ablauf: Email-Versand & Registrierung

```
Admin gibt Email ein
  → Prüfung: Ist Email bereits registriert? → Fehlermeldung
  → Prüfung: Gibt es offene Einladung für diese Email? → Fehlermeldung
  → Einladung wird in Datenbank erstellt
  → Supabase Edge Function versendet Email mit Registrierungslink
  → Eingeladener klickt Link → Registrierungsseite öffnet sich
  → Email ist vorausgefüllt (aus Token geladen, nicht änderbar)
  → Nutzer setzt Passwort + Passwort bestätigen
  → Nach Registrierung: Einladung wird als "Angenommen" markiert
```

Registrierungslink-Format: `https://voting-app.../register?token=ABC123`

### Tech-Entscheidungen

| Entscheidung | Begründung |
|---|---|
| Supabase Edge Function für Email-Versand | Läuft serverseitig, kein externer Service nötig für MVP. Eingebaute Resend-Integration. |
| Email-Feld zur bestehenden Tabelle hinzufügen | Einfacher, Infrastruktur existiert bereits. Nur 1 Spalte ergänzen. |
| Status berechnen statt speichern | Weniger Daten-Inkonsistenz. Status ergibt sich logisch aus vorhandenen Feldern. |
| Admin-Bereich als eigene Route `/admin/invitations` | Klare Trennung. Ermöglicht spätere Erweiterung für PROJ-5/PROJ-6 unter `/admin/...`. |
| Admin-Check im Header für Navigation | Nur Admins sehen den Link zum Admin-Bereich. |

### Dependencies

Keine neuen Packages nötig. Alles mit bestehenden Tools abgedeckt:
- shadcn/ui (Tabelle, Formular, Buttons) → bereits installiert
- Supabase Client → bereits installiert
- Sonner (Toast-Benachrichtigungen) → bereits installiert
- Lucide Icons → bereits installiert

Für Email-Versand: Supabase Edge Function mit eingebauter Resend-Integration.

### Umfang der Arbeiten

| Bereich | Aufwand |
|---|---|
| Datenbank: 1 Spalte hinzufügen (email) + API-Anpassung | Klein |
| Edge Function: Email-Versand Template | Mittel |
| Admin-UI: Neue Seite mit Formular + Tabelle | Mittel |
| Header: Admin-Link einbauen | Klein |
| Registrierung: Email aus Token vorausfüllen + sperren | Klein |
| Duplikat-Prüfungen: Email-Validierung | Klein |

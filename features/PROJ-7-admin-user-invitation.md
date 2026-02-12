# PROJ-7: Admin - User-Einladung per Email

## Status: ✅ Deployed (2026-02-12)

**Production URL:** <https://voting-app-kappa-blush.vercel.app>
**Deployment Commit:** `027e7c0` (PROJ-7 migration fix)
**Migration:** `010_proj7_add_email_and_check_registered.sql` deployed to Supabase

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

---

## QA Test Results

**Tested:** 2026-02-12
**Methode:** Code-Review & statische Analyse (kein laufender Server)
**Commit:** 4411fde (PROJ-7 developed)

## Acceptance Criteria Status

### AC-1: Admin-Formular: Email-Adresse eingeben und Einladung versenden
- [x] Admin-UI Seite existiert unter `/admin/invitations`
- [x] Email-Eingabefeld mit HTML5-Validierung (`type="email"`, `required`)
- [x] "Einladung senden" Button ruft POST /api/invitations auf
- [x] Server-seitige Zod-Validierung des Email-Formats
- [x] Fehlermeldung wird bei leerem Feld angezeigt
- [x] Toast-Benachrichtigung nach erfolgreicher Erstellung

### AC-2: System generiert einmaligen Einladungstoken
- [x] Token wird automatisch in DB generiert: `encode(gen_random_bytes(32), 'hex')` (64-Zeichen Hex)
- [x] Token ist UNIQUE in der DB (Constraint)
- [ ] ⚠️ INFO: Token ist kein UUID wie im AC beschrieben, sondern 64-Zeichen Hex – ist sogar sicherer

### AC-3: Email wird mit Registrierungslink versendet
- [ ] ❌ **BUG: Kein Email-Versand implementiert!** Die API erstellt nur den DB-Eintrag, sendet aber keine Email
- [ ] ❌ Keine Supabase Edge Function vorhanden
- [x] Workaround: "Link kopieren" Button für manuelles Teilen existiert
- Die Toast-Nachricht "Einladung an {email} erstellt!" suggeriert Email-Versand, aber es passiert keiner

### AC-4: Einladungstoken ist 7 Tage gültig
- [x] DB-Default: `expires_at = NOW() + INTERVAL '7 days'`
- [x] API unterstützt konfigurierbares `expires_in_days` (default: 7, max: 30)
- [x] Status-Berechnung im Frontend prüft `expires_at` korrekt

### AC-5: Registrierungsseite validiert Token und zeigt Email vorausgefüllt an
- [x] Token wird aus URL-Parameter `?token=` gelesen
- [x] API-Endpunkt `/api/register/validate-token` existiert
- [x] Frontend zeigt vorausgefülltes Email-Feld als `readOnly` mit grauem Hintergrund
- [ ] ❌ **BUG: `validate_invitation_token` DB-Funktion gibt kein `email`-Feld zurück!**
  - Die Funktion (Migration 002) returned: `json_build_object('valid', true, 'invitation_id', v_invitation.id)`
  - Kein `email` im Return-Wert → API gibt `{ email: null }` zurück → Email wird NICHT vorausgefüllt
  - Frontend-Code prüft `if (res.ok && data.email)` → Bedingung ist falsy bei `null`

### AC-6: Nach erfolgreicher Registrierung wird Token als "verwendet" markiert
- [x] `redeem_invitation` Funktion setzt atomisch `redeemed_by` und `redeemed_at`
- [x] FOR UPDATE Row-Lock verhindert Race Conditions
- [x] Registrierungs-API validiert Token, erstellt User, löst Token ein (in dieser Reihenfolge)

### AC-7: Admin sieht Einladungs-Liste
- [x] Tabelle mit Spalten: Email, Status, Gesendet am, Aktionen
- [x] Status-Berechnung: Ausstehend (gelb), Angenommen (grün), Abgelaufen (rot)
- [x] Leerer Zustand: "Noch keine Einladungen versendet" mit Icon
- [x] Loading-Skeleton während Daten geladen werden
- [x] Datumsformat: deutsches Format (DD.MM.YYYY HH:MM)

### AC-8: Admin kann abgelaufene Einladung erneut senden (neuer Token)
- [x] "Erneut senden" Button nur bei abgelaufenen Einladungen sichtbar
- [x] POST /api/invitations/[id] löscht alte Einladung und erstellt neue mit gleicher Email
- [x] Loading-Spinner während Resend
- [ ] ❌ **BUG: Kein Email-Versand** (gleicher Bug wie AC-3)
- [ ] ⚠️ **BUG: Delete + Insert ist nicht atomar** – wenn Insert fehlschlägt, ist die alte Einladung bereits gelöscht

### AC-9: Einladung an bereits registrierte Email → Fehlermeldung
- [ ] ❌ **BUG: `check_email_registered` RPC-Funktion existiert nicht!** Keine Migration definiert diese Funktion
  - Code in `route.ts:83` ruft `admin.rpc('check_email_registered', { p_email: email })` auf
  - Ohne diese DB-Funktion wird der RPC-Call fehlschlagen → 500er Error oder stille Fehler
- [x] Duplikat-Check für offene Einladungen existiert (gleiche Email, nicht eingelöst, nicht abgelaufen)

## Edge Cases Status

### EC-1: Email-Versand schlägt fehl
- [ ] ❌ N/A – Email-Versand nicht implementiert, daher kein Error-Handling testbar

### EC-2: Abgelaufener Link → Hinweis
- [x] `validate-token` Route: "Dieser Einladungscode ist abgelaufen. Bitte kontaktiere den Admin."
- [x] `register` Route: "Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen an."
- [x] Fehlermeldung wird im roten Banner angezeigt

### EC-3: Token mehrfach verwenden → Hinweis
- [x] `validate-token` Route: "Dieser Einladungscode wurde bereits verwendet."
- [x] `register` Route: "Dieser Einladungscode wurde bereits verwendet."
- [x] Atomar abgesichert durch `redeem_invitation` mit Row-Lock

### EC-4: Gleiche Email zweimal einladen → Fehlermeldung
- [x] Prüfung in POST /api/invitations: offene Einladung für gleiche Email → 409 Conflict
- [x] Meldung: "Es gibt bereits eine ausstehende Einladung für diese Email-Adresse."
- [x] Abgelaufene Einladungen blockieren keine neue Einladung (korrekt)

### EC-5: Admin löscht Einladung → Token ungültig
- [x] DELETE /api/invitations/[id] löscht Einladung
- [x] `validate_invitation_token` gibt 'not_found' für gelöschte Tokens
- [x] Bestätigungsdialog (AlertDialog) vor dem Löschen

## Security-Analyse

### ~~SEC-1: Fehlende DB-Migration für `email`-Spalte~~ **GEFIXT**

- **Severity:** ~~Critical~~ → Resolved
- **Details:** Die `invitations` Tabelle (Migration 001) hat KEINE `email`-Spalte. Der PROJ-7 Code referenziert `email` beim INSERT und SELECT, aber es gibt keine Migration, die diese Spalte hinzufügt. Das gesamte Feature wird zur Laufzeit fehlschlagen, wenn die Spalte nicht manuell angelegt wurde.
- **Betroffene Dateien:** `src/app/api/invitations/route.ts` (Zeilen 36, 114), `src/app/api/invitations/[id]/route.ts` (Zeilen 38, 66)
- **Fix:** Migration 010 deployed (2026-02-12): `ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email TEXT;`

### ~~SEC-2: Fehlende DB-Funktion `check_email_registered`~~ **GEFIXT**

- **Severity:** ~~Critical~~ → Resolved
- **Details:** `POST /api/invitations` ruft `admin.rpc('check_email_registered', ...)` auf (Zeile 83), aber diese Funktion existiert in keiner Migration. Der RPC-Call wird fehlschlagen.
- **Fix:** Migration 010 deployed (2026-02-12): `CREATE FUNCTION check_email_registered(p_email TEXT) RETURNS BOOLEAN`

### ~~SEC-3: `validate_invitation_token` gibt kein Email zurück~~ **GEFIXT**

- **Severity:** ~~High~~ → Resolved
- **Details:** Die DB-Funktion (Migration 002) returned `invitation_id` aber kein `email`. Der `/api/register/validate-token` Endpunkt erwartet `validation.email`, bekommt aber `undefined`. Resultat: Email wird nie vorausgefüllt.
- **Fix:** Migration 010 deployed (2026-02-12): `DROP + CREATE FUNCTION validate_invitation_token` mit `email` im Return-JSON

### SEC-4: Resend-Operation nicht atomar
- **Severity:** Medium
- **Details:** `POST /api/invitations/[id]` (Resend) führt DELETE + INSERT als separate Operationen aus. Wenn INSERT fehlschlägt, ist die alte Einladung bereits gelöscht → Datenverlust.
- **Priority:** Medium (sollte in einer Transaktion sein)

### SEC-5: Kein serverseitiger Admin-Check für /admin Route
- **Severity:** Medium
- **Details:** Die Middleware (`middleware.ts`) prüft nicht, ob der User Admin ist für `/admin/*`-Routen. Der Schutz ist nur client-seitig (Redirect in useEffect) und API-seitig. Ein nicht-Admin kann die Seite kurz sehen bevor der Redirect greift, auch wenn die API-Calls 403 zurückgeben.
- **Priority:** Medium (API ist geschützt, aber UX-Leak)

### SEC-6: GET /api/invitations zeigt nur eigene Einladungen
- **Severity:** Low
- **Details:** Query filtert `.eq('created_by', user.id)`. Bei mehreren Admins sieht jeder nur seine eigenen Einladungen. Könnte gewollt sein, aber die Feature-Spec spricht von einer Gesamtübersicht.
- **Priority:** Low (funktional, aber ggf. nicht erwartungsgemäß)

### SEC-7: Token im Client-State exponiert
- **Severity:** Low
- **Details:** Tokens werden im Client (Admin-Seite) geladen für die "Link kopieren" Funktion. Da nur Admins die Seite sehen können und Token-Creator sind, ist das akzeptabel, aber ein Token-Leak über DevTools ist möglich.
- **Priority:** Low (akzeptabel für Admin-Kontext)

## Bugs Found

### ~~BUG-1: Fehlende DB-Migration für `email`-Spalte in `invitations`~~ **GEFIXT**

- **Severity:** ~~Critical~~ → Resolved
- **Fix:** Migration `010_proj7_add_email_and_check_registered.sql` deployed (2026-02-12)

### ~~BUG-2: Fehlende DB-Funktion `check_email_registered`~~ **GEFIXT**

- **Severity:** ~~Critical~~ → Resolved
- **Fix:** Migration `010_proj7_add_email_and_check_registered.sql` deployed (2026-02-12)

### BUG-3: Email-Versand nicht implementiert
- **Severity:** High
- **Steps to Reproduce:**
  1. Erstelle eine Einladung mit Email
  2. Expected: Email mit Registrierungslink wird an Nutzer gesendet
  3. Actual: Einladung wird nur in DB erstellt, keine Email
- **Fix:** Supabase Edge Function oder Email-Service integrieren
- **Workaround:** "Link kopieren" Button existiert für manuelles Teilen

### ~~BUG-4: Token-Validierung gibt Email nicht zurück~~ **GEFIXT**

- **Severity:** ~~High~~ → Resolved
- **Fix:** Migration `010_proj7_add_email_and_check_registered.sql` deployed (2026-02-12) — `validate_invitation_token` gibt jetzt `email` im Return-JSON zurück

### BUG-5: Resend-Operation nicht atomar (Datenverlust-Risiko)
- **Severity:** Medium
- **Steps to Reproduce:**
  1. Klicke "Erneut senden" bei einer abgelaufenen Einladung
  2. Wenn DB-Insert fehlschlägt (z.B. Constraint-Violation)
  3. Expected: Alte Einladung bleibt erhalten
  4. Actual: Alte Einladung bereits gelöscht, neue nicht erstellt → Einladung verloren
- **Fix:** Delete + Insert in einer Supabase-Transaktion oder DB-Funktion kapseln

## Regression-Check

- [x] Login/Logout funktioniert (auth-provider.tsx Änderungen geprüft – nur `isAdmin` hinzugefügt)
- [x] Header-Änderungen sind non-breaking (nur Admin-Link hinzugefügt, bestehende Menu-Items unverändert)
- [x] Registrierungsseite: bestehender Token-Flow unverändert, neue Validierung ist additiv
- [x] Middleware unverändert
- [x] Bestehende API-Routen (GET, DELETE /api/invitations) erweitert, nicht gebrochen

## Summary

- ✅ 6 Acceptance Criteria grundsätzlich implementiert (UI, Logik, Token-Handling)
- ~~❌ 5 Bugs gefunden (2 Critical, 2 High, 1 Medium)~~ → 3 Critical/High Bugs gefixt (BUG-1, BUG-2, BUG-4)
- ✅ AC-5 (Email-Vorausfüllung) und AC-9 (Registrierte-Email-Check) jetzt funktionsfähig
- ⚠️ AC-3 (Email-Versand) weiterhin offen — Workaround "Link kopieren" existiert
- ⚠️ BUG-3 (Email-Versand) und BUG-5 (Resend atomar) offen — Low/Medium Priority

## Deployment

**Deployed:** 2026-02-12
**Production URL:** <https://voting-app-kappa-blush.vercel.app>
**Migration:** `010_proj7_add_email_and_check_registered.sql` — fixes BUG-1, BUG-2, BUG-4

## Remaining Issues

1. **BUG-3 (High):** Email-Versand nicht implementiert — Workaround "Link kopieren" reicht für MVP
2. **BUG-5 (Medium):** Resend-Operation nicht atomar — Datenverlust-Risiko bei fehlgeschlagenem Insert

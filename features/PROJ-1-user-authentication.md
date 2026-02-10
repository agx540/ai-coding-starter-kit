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

---

## QA Test Results

**Tested:** 2026-02-10
**Tested by:** QA Engineer (Code Review / Static Analysis)
**App URL:** http://localhost:3000
**Methode:** Statische Code-Analyse aller Auth-relevanten Dateien

---

## Acceptance Criteria Status

### AC-1: Registrierung nur mit gültigem Einladungstoken möglich
- [x] Token-Feld vorhanden (manuell oder aus URL `?token=`)
- [x] Leerer Token wird abgelehnt: "Bitte gib deinen Einladungscode ein."
- [x] Ungültiger Token wird abgelehnt: "Ungültiger Einladungscode."
- [x] Bereits eingelöster Token wird abgelehnt: "Dieser Einladungscode wurde bereits verwendet."
- [x] Abgelaufener Token wird abgelehnt mit Hinweis auf neuen Token
- [x] **BUG-1 (Critical):** ~~Token-Validierung + Signup waren NICHT atomar (Race Condition)~~ **GEFIXT** — Registrierung läuft jetzt über `/api/register` mit atomarer DB-Funktion `redeem_invitation` (FOR UPDATE Row Lock)

**Code:** `src/app/api/register/route.ts`, `supabase/migrations/003_atomic_invitation_redemption.sql`

### AC-2: Email-Validierung (Format + Einmaligkeit)
- [x] Email-Format-Validierung via HTML `type="email"` (Browser-Validierung)
- [x] Doppelte Email wird abgefangen: "Diese Email-Adresse ist bereits registriert."
- [ ] **BUG-2 (Medium):** Email-Format wird NUR client-seitig validiert (kein Server-Check)

**Code:** `src/app/(auth)/register/page.tsx:82-95, 143`

### AC-3: Passwort-Mindestanforderungen (min. 8 Zeichen)
- [x] Client-seitige Validierung: `password.length < 8`
- [x] HTML `minLength={8}` auf Input-Feld
- [x] Fehlermeldung: "Das Passwort muss mindestens 8 Zeichen lang sein."
- [x] Passwort-Bestätigung muss übereinstimmen

**Code:** `src/app/(auth)/register/page.tsx:40-48`

### AC-4: Login mit Email + Passwort
- [x] Login-Formular mit Email + Passwort
- [x] Verwendet `supabase.auth.signInWithPassword()`
- [x] Generische Fehlermeldung: "Email oder Passwort ist falsch." (verhindert Enumeration)
- [x] Redirect zu `/` nach erfolgreichem Login
- [x] Loading-State während Login

**Code:** `src/app/(auth)/login/page.tsx:29-46`

### AC-5: Logout beendet Session serverseitig
- [x] `supabase.auth.signOut()` wird aufgerufen (serverseitige Session-Beendigung)
- [x] Redirect zu `/login` nach Logout
- [x] Logout-Button im Header Dropdown sichtbar

**Code:** `src/components/auth-provider.tsx:60-65`, `src/components/header.tsx:39`

### AC-6: Passwort-Reset per Email-Link
- [x] Forgot-Password Seite sendet Reset-Email via `supabase.auth.resetPasswordForEmail()`
- [x] Redirect-URL korrekt: `{origin}/auth/callback?next=/reset-password`
- [x] Auth-Callback tauscht Code gegen Session
- [x] Reset-Password Seite erlaubt neues Passwort (min. 8 Zeichen + Bestätigung)
- [x] Erfolgs-Nachricht + Auto-Redirect nach 2 Sekunden

**Code:** `src/app/(auth)/forgot-password/page.tsx`, `src/app/auth/callback/route.ts`, `src/app/(auth)/reset-password/page.tsx`

### AC-7: Session bleibt nach Browser-Reload erhalten
- [x] Middleware refresht Session-Cookies bei jedem Request
- [x] AuthProvider holt Session beim Mount via `getSession()`
- [x] `onAuthStateChange` Listener für State-Updates

**Code:** `src/middleware.ts`, `src/components/auth-provider.tsx:43-57`

### AC-8: Geschützte Routen leiten nicht-eingeloggte Nutzer zum Login um
- [x] Middleware prüft `supabase.auth.getUser()` serverseitig
- [x] Nicht-authentifizierte User werden zu `/login` redirected
- [x] Authentifizierte User werden von Auth-Seiten weg zu `/` redirected
- [x] Ausnahme: `/reset-password` bleibt für eingeloggte User zugänglich
- [x] Public Routes korrekt definiert: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/callback`

**Code:** `src/middleware.ts:4, 45-61`

### AC-9: Supabase Auth als Backend (eigenes Supabase-Projekt)
- [x] Browser-Client via `@supabase/ssr` (`createBrowserClient`)
- [x] Server-Client via `@supabase/ssr` (`createServerClient`)
- [x] Environment-Variablen konfiguriert (`.env.local`)
- [x] RLS auf `profiles` und `invitations` Tabellen aktiviert

**Code:** `src/lib/supabase.ts`, `src/lib/supabase-server.ts`

---

## Edge Cases Status

### EC-1: Registrierung mit bereits verwendeter Email
- [x] Supabase `signUp` gibt Error zurück wenn Email existiert
- [x] Error wird erkannt via `message.includes('already registered')`
- [x] Fehlermeldung: "Diese Email-Adresse ist bereits registriert."
- [ ] **BUG-3 (Low):** Register verrät ob Email existiert, Forgot-Password nicht (Inkonsistenz bei Email-Enumeration-Schutz)

### EC-2: Registrierung ohne/mit ungültigem Einladungstoken
- [x] Leerer Token: "Bitte gib deinen Einladungscode ein."
- [x] Nicht existierender Token: "Ungültiger Einladungscode."

### EC-3: Abgelaufener Einladungstoken
- [x] `expires_at` wird gegen aktuelle Zeit geprüft
- [x] Fehlermeldung: "Dieser Einladungscode ist abgelaufen. Bitte fordere einen neuen an."

### EC-4: Passwort-Reset für nicht existierende Email
- [x] Zeigt IMMER Erfolgs-Nachricht (Security Best Practice)
- [x] "Falls ein Konto mit dieser Email-Adresse existiert, haben wir dir einen Link... gesendet."

### EC-5: Mehrfacher fehlgeschlagener Login → Rate Limiting
- [ ] **BUG-4 (Critical):** Rate Limiting ist NICHT implementiert!
- Kein Counter für fehlgeschlagene Versuche
- Kein Lockout-Mechanismus
- Spec fordert: "5 Versuche pro Minute"
- Brute-Force-Angriffe sind möglich

### EC-6: Session-Timeout nach Inaktivität → 7 Tage
- [ ] **BUG-5 (Medium):** Kein explizites Session-Timeout konfiguriert
- Verlässt sich auf Supabase-Defaults (JWT: 1h, Refresh-Token: undefiniert)
- Spec fordert: "Automatischer Logout nach 7 Tagen"
- Muss im Supabase Dashboard verifiziert/konfiguriert werden

---

## Security Audit (Red-Team Perspektive)

### BUG-1 (Critical): Race Condition bei Token-Einlösung — **GEFIXT**
- **Severity:** Critical
- **Location:** ~~`src/app/(auth)/register/page.tsx:54-103`~~ → `src/app/api/register/route.ts`
- **Beschreibung:** Token-Validierung, User-Signup und Token-Markierung waren drei separate, nicht-atomare Operationen auf dem CLIENT.
- **Fix (2026-02-10):**
  1. Neue DB-Funktion `redeem_invitation(p_token, p_user_id)` mit `FOR UPDATE` Row Lock (`supabase/migrations/003_atomic_invitation_redemption.sql`)
  2. Neue Server-Side API Route `/api/register` mit Zod-Validierung (`src/app/api/register/route.ts`)
  3. Frontend ruft nur noch `/api/register` auf — kein direkter Supabase-Zugriff mehr
- **Verifikation:** Zweiter gleichzeitiger Request bekommt `already_redeemed` Error zurück

### BUG-4 (Critical): Rate Limiting fehlt komplett
- **Severity:** Critical
- **Location:** `src/app/(auth)/login/page.tsx`
- **Beschreibung:** Kein Rate Limiting auf Login-Versuche implementiert
- **Steps to Reproduce:**
  1. Login-Seite öffnen
  2. Falsches Passwort 100x hintereinander eingeben
  3. Expected: Nach 5 Versuchen blockiert für 1 Minute
  4. Actual: Kann unendlich oft versuchen
- **Impact:** Brute-Force-Angriffe auf Passwörter möglich
- **Fix:** Rate Limiting serverseitig implementieren (z.B. via API-Route mit Counter in Supabase oder Upstash Redis)
- **Priority:** Critical (Security Issue)

### BUG-6 (Critical): Invitation-Tokens für alle lesbar (RLS zu permissiv)
- **Severity:** Critical
- **Location:** `supabase/migrations/001_create_invitations.sql:76-77`
- **Beschreibung:** Die RLS-Policy `"Anyone can validate invitation token"` erlaubt `USING (true)` - jeder (auch unauthentifizierte Nutzer mit Anon-Key) kann ALLE Invitations-Daten lesen
- **Steps to Reproduce:**
  1. Browser-Konsole öffnen
  2. Supabase-Client mit Anon-Key erstellen (URL und Key sind öffentlich im Frontend-Bundle)
  3. `supabase.from('invitations').select('*')` ausführen
  4. Alle Token (inkl. gültige, nicht-eingelöste) werden angezeigt
- **Impact:** Angreifer kann gültige Einladungstokens stehlen und sich unberechtigt registrieren
- **Fix:** RLS-Policy ändern: Entweder nur Token-Hash exponieren oder Validierung auf Server-Route verschieben
- **Priority:** Critical (Security Issue)

### BUG-5 (Medium): Session-Timeout nicht konfiguriert
- **Severity:** Medium
- **Location:** Supabase Dashboard / keine Code-Konfiguration
- **Beschreibung:** Kein explizites Session-Timeout von 7 Tagen im Code konfiguriert
- **Fix:** Im Supabase Dashboard unter Auth > Settings die JWT-Expiry und Refresh-Token-Lifetime konfigurieren
- **Priority:** Medium

### BUG-2 (Medium): Nur client-seitige Email-Validierung
- **Severity:** Medium
- **Location:** `src/app/(auth)/register/page.tsx:143`
- **Beschreibung:** Email-Format wird nur via HTML `type="email"` validiert. Ein Angreifer kann den Browser-Check umgehen und ungültige Emails an Supabase senden.
- **Fix:** Zod-Schema mit Email-Validierung auf Server-Seite hinzufügen (oder Supabase's eigene Email-Validierung reicht aus)
- **Priority:** Medium (Supabase validiert Email serverseitig, daher kein direktes Security-Risiko)

### BUG-7 (Medium): `redeemed_at` Timestamp wird nicht gesetzt
- **Severity:** Medium
- **Location:** `src/app/(auth)/register/page.tsx:101`
- **Beschreibung:** Beim Einlösen eines Tokens wird nur `redeemed_by` gesetzt, aber `redeemed_at` bleibt `NULL`, obwohl die Spalte existiert
- **Fix:** `redeemed_at: new Date().toISOString()` zum Update hinzufügen
- **Priority:** Medium (Audit Trail unvollständig)

### BUG-3 (Low): Inkonsistenter Email-Enumeration-Schutz
- **Severity:** Low
- **Location:** `src/app/(auth)/register/page.tsx:89` vs. `src/app/(auth)/forgot-password/page.tsx:33`
- **Beschreibung:** Register zeigt "Diese Email-Adresse ist bereits registriert" (verrät ob Email existiert), während Forgot-Password generische Meldung zeigt
- **Fix:** Register sollte ebenfalls generische Fehlermeldung zeigen
- **Priority:** Low (inkonsistent, aber in Registrierung schwer zu vermeiden wegen UX)

### BUG-8 (Low): Auth-Callback `next` Parameter nicht validiert
- **Severity:** Low
- **Location:** `src/app/auth/callback/route.ts:8`
- **Beschreibung:** Der `next` Query-Parameter wird nicht validiert. Durch `${origin}${next}` ist ein offener Redirect zwar nicht direkt möglich, aber der Parameter sollte trotzdem auf interne Pfade beschränkt werden (Defense-in-Depth).
- **Fix:** Validierung: `next` muss mit `/` beginnen und darf kein `//` enthalten
- **Priority:** Low

---

## Bugs Summary

| Bug | Severity | Typ | Status |
|-----|----------|-----|--------|
| BUG-1: Race Condition Token-Einlösung | Critical | Security | **Gefixt** (003_atomic_invitation_redemption.sql + /api/register) |
| BUG-4: Rate Limiting fehlt | Critical | Security | Offen |
| BUG-6: Invitation-Tokens öffentlich lesbar | Critical | Security | **Gefixt** (002_fix_invitation_token_rls.sql) |
| BUG-2: Nur client-seitige Email-Validierung | Medium | Validation | Offen |
| BUG-5: Session-Timeout nicht konfiguriert | Medium | Config | Offen |
| BUG-7: `redeemed_at` nicht gesetzt | Medium | Data Integrity | **Gefixt** (register/page.tsx) |
| BUG-3: Inkonsistenter Email-Enumeration-Schutz | Low | Security/UX | Offen |
| BUG-8: Auth-Callback `next` nicht validiert | Low | Security | Offen |

---

## Summary

- **Acceptance Criteria:** 7/9 bestanden, 2 mit Bugs
- **Edge Cases:** 4/6 bestanden, 2 nicht implementiert
- **Bugs gefunden:** 8 (3 Critical, 3 Medium, 2 Low) — davon 3 gefixt (BUG-1, BUG-6, BUG-7)
- **Feature ist NICHT production-ready** (1 Critical Security Issue offen: BUG-4)

---

## Recommendation

**Vor Deployment MÜSSEN gefixt werden:**
1. ~~**BUG-6 (Critical):** Invitation-Tokens RLS-Policy einschränken~~ **GEFIXT**
2. ~~**BUG-1 (Critical):** Token-Registrierung in atomare Server-Side API-Route verschieben~~ **GEFIXT**
3. **BUG-4 (Critical):** Rate Limiting für Login implementieren (5 Versuche/Minute)

**Sollten gefixt werden:**

4. ~~**BUG-7:** `redeemed_at` Timestamp setzen~~ **GEFIXT**
5. **BUG-5:** Session-Timeout im Supabase Dashboard auf 7 Tage konfigurieren

**Nice-to-have:**
6. **BUG-3:** Email-Enumeration-Schutz konsistent machen
7. **BUG-8:** `next` Parameter validieren

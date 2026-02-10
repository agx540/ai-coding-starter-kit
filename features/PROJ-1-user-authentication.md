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

**Revalidation:** 2026-02-10
**Revalidated by:** QA Engineer (Fix Validation)
**Methode:** Code Review aller Migrations (001-004), API Routes, Frontend-Komponenten

---

## Acceptance Criteria Status

### AC-1: Registrierung nur mit gültigem Einladungstoken möglich
- [x] Token-Feld vorhanden (manuell oder aus URL `?token=`)
- [x] Leerer Token wird abgelehnt: "Bitte gib deinen Einladungscode ein."
- [x] Ungültiger Token wird abgelehnt: "Ungültiger Einladungscode."
- [x] Bereits eingelöster Token wird abgelehnt: "Dieser Einladungscode wurde bereits verwendet."
- [x] Abgelaufener Token wird abgelehnt mit Hinweis auf neuen Token
- [x] ~~**BUG-1 (Critical):** Token-Validierung + Signup waren NICHT atomar (Race Condition)~~ **GEFIXT + VALIDIERT** — `redeem_invitation()` mit `FOR UPDATE` Row Lock, `/api/register` als atomare Server-Side Route

**Code:** `src/app/api/register/route.ts`, `supabase/migrations/003_atomic_invitation_redemption.sql`
**Validierung:** `FOR UPDATE` lockt die Row, zweiter gleichzeitiger Request bekommt `already_redeemed`. Residuales Risiko: Wenn Redemption nach signUp fehlschlägt, existiert User-Account ohne eingelöstes Token (Code-Kommentar Zeile 77-79 dokumentiert Trade-off).

### AC-2: Email-Validierung (Format + Einmaligkeit)
- [x] Email-Format-Validierung via HTML `type="email"` (Browser-Validierung)
- [x] Doppelte Email wird abgefangen: "Diese Email-Adresse ist bereits registriert."
- [x] ~~**BUG-2 (Medium):** Email-Format wird NUR client-seitig validiert~~ **GEFIXT + VALIDIERT** — `/api/register` nutzt Zod-Schema mit `z.string().email()` für Server-seitige Validierung

**Code:** `src/app/api/register/route.ts:7` (Zod), `src/app/(auth)/register/page.tsx:82-95` (Client)

### AC-3: Passwort-Mindestanforderungen (min. 8 Zeichen)
- [x] Client-seitige Validierung: `password.length < 8`
- [x] Server-seitige Validierung: Zod `z.string().min(8)` in `/api/register`
- [x] HTML `minLength={8}` auf Input-Feld
- [x] Fehlermeldung: "Das Passwort muss mindestens 8 Zeichen lang sein."
- [x] Passwort-Bestätigung muss übereinstimmen

**Code:** `src/app/api/register/route.ts:8`, `src/app/(auth)/register/page.tsx:40-48`

### AC-4: Login mit Email + Passwort
- [x] Login-Formular mit Email + Passwort
- [x] Login über Server-Side API Route `/api/login` (nicht direkt via Supabase Client)
- [x] Zod-Validierung auf Server-Seite
- [x] Generische Fehlermeldung: "Email oder Passwort ist falsch." (verhindert Enumeration)
- [x] Redirect zu `/` nach erfolgreichem Login
- [x] Loading-State während Login
- [x] Verbleibende Versuche werden angezeigt bei Fehlschlag

**Code:** `src/app/api/login/route.ts`, `src/app/(auth)/login/page.tsx:29-46`

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
- [x] RLS auf `login_attempts` Tabelle aktiviert (keine Policies = kein direkter Client-Zugriff)

**Code:** `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `supabase/migrations/004_login_rate_limiting.sql:18`

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
- [x] ~~**BUG-4 (Critical):** Rate Limiting war NICHT implementiert~~ **GEFIXT + VALIDIERT**
- [x] `login_attempts` Tabelle trackt fehlgeschlagene Versuche (RLS enabled, keine Policies)
- [x] `check_login_rate_limit(p_email)` prüft ob >= 5 Versuche in 60 Sekunden
- [x] `record_failed_login(p_email, p_ip)` loggt Fehlversuch + Cleanup (> 1h)
- [x] `clear_login_attempts(p_email)` löscht Versuche bei erfolgreichem Login
- [x] API Route `/api/login` integriert alle 3 Funktionen korrekt
- [x] Frontend zeigt verbleibende Versuche + Lockout-Meldung (429-Status)
- [ ] **BUG-9 (Medium):** Rate Limiting ist nur per Email, nicht per IP (siehe Security Audit)

**Code:** `supabase/migrations/004_login_rate_limiting.sql`, `src/app/api/login/route.ts`

### EC-6: Session-Timeout nach Inaktivität → 7 Tage
- [ ] **BUG-5 (Medium):** Kein explizites Session-Timeout konfiguriert
- Verlässt sich auf Supabase-Defaults (JWT: 1h, Refresh-Token: undefiniert)
- Spec fordert: "Automatischer Logout nach 7 Tagen"
- Muss im Supabase Dashboard verifiziert/konfiguriert werden

---

## Security Audit (Red-Team Perspektive)

### BUG-1 (Critical): Race Condition bei Token-Einlösung — **GEFIXT + VALIDIERT**
- **Severity:** Critical
- **Location:** `src/app/api/register/route.ts` + `supabase/migrations/003_atomic_invitation_redemption.sql`
- **Beschreibung:** Token-Validierung, User-Signup und Token-Markierung waren drei separate, nicht-atomare Operationen auf dem CLIENT.
- **Fix (2026-02-10):**
  1. Neue DB-Funktion `redeem_invitation(p_token, p_user_id)` mit `FOR UPDATE` Row Lock
  2. Neue Server-Side API Route `/api/register` mit Zod-Validierung
  3. Frontend ruft nur noch `/api/register` auf — kein direkter Supabase-Zugriff mehr
- **Validierung (2026-02-10):** Code-Review bestätigt korrekte Implementierung. `FOR UPDATE` lockt Row, zweiter Request bekommt `already_redeemed`. Residuales Risiko dokumentiert (orphaned User bei Race Condition zwischen validate und redeem).

### BUG-4 (Critical): Rate Limiting fehlt komplett — **GEFIXT + VALIDIERT**
- **Severity:** Critical
- **Location:** `supabase/migrations/004_login_rate_limiting.sql` + `src/app/api/login/route.ts`
- **Beschreibung:** Kein Rate Limiting auf Login-Versuche war implementiert
- **Fix (2026-02-10):**
  1. Neue Tabelle `login_attempts` mit RLS (keine Policies = kein Client-Zugriff)
  2. 3 SECURITY DEFINER Funktionen: `check_login_rate_limit`, `record_failed_login`, `clear_login_attempts`
  3. Neue Server-Side API Route `/api/login` integriert Rate-Limit-Check vor Auth-Versuch
  4. Frontend zeigt verbleibende Versuche + Lockout-Meldung
- **Validierung (2026-02-10):** Code-Review bestätigt korrekte Implementierung. Flow: Zod-Validierung → IP-Extraktion → Rate-Limit-Check → Auth-Versuch → Record/Clear. 5 Versuche pro 60 Sekunden, dann HTTP 429. Cleanup von Einträgen > 1h. Alle DB-Funktionen sind SECURITY DEFINER (bypassen RLS korrekt).
- **Residuales Risiko:** Siehe BUG-9.

### BUG-6 (Critical): Invitation-Tokens für alle lesbar (RLS zu permissiv) — **GEFIXT + VALIDIERT**
- **Severity:** Critical
- **Location:** `supabase/migrations/002_fix_invitation_token_rls.sql`
- **Beschreibung:** Die RLS-Policy `"Anyone can validate invitation token"` erlaubte `USING (true)` — jeder konnte ALLE Invitations-Daten lesen
- **Fix (2026-02-10):**
  1. Permissive SELECT-Policy entfernt (`DROP POLICY`)
  2. Neue admin-only SELECT-Policy
  3. `validate_invitation_token()` als SECURITY DEFINER Funktion (gibt nur `valid/error` zurück, nie Token-Daten)
- **Validierung (2026-02-10):** Code-Review bestätigt. Reguläre User können nicht mehr auf `invitations` Tabelle zugreifen. Validation läuft über sichere RPC-Funktion. Token-Brute-Force impraktikabel (256 Bit Entropy, 32 Byte hex).

### BUG-9 (Medium): Rate Limiting nur per Email, nicht per IP — **NEU**
- **Severity:** Medium
- **Location:** `supabase/migrations/004_login_rate_limiting.sql:22-34`
- **Beschreibung:** `check_login_rate_limit` zählt nur per Email. Ein Angreifer kann 5 Passwörter pro Account pro Minute für JEDEN Account testen (distributed brute-force). Das `ip_address`-Feld wird gespeichert aber nie zur Rate-Limit-Prüfung herangezogen.
- **Impact:** Distributed Brute-Force über viele Accounts möglich
- **Fix-Vorschlag:** Zusätzliche IP-basierte Rate-Limit-Funktion hinzufügen (z.B. max. 20 Login-Versuche pro IP pro Minute, unabhängig vom Account)
- **Priority:** Medium (kein sofortiges Deployment-Blocker, aber sollte zeitnah gefixt werden)

### BUG-5 (Medium): Session-Timeout nicht konfiguriert — **OFFEN**
- **Severity:** Medium
- **Location:** Supabase Dashboard / keine Code-Konfiguration
- **Beschreibung:** Kein explizites Session-Timeout von 7 Tagen im Code konfiguriert
- **Fix:** Im Supabase Dashboard unter Auth > Settings die JWT-Expiry und Refresh-Token-Lifetime konfigurieren
- **Priority:** Medium

### BUG-2 (Medium): Nur client-seitige Email-Validierung — **GEFIXT + VALIDIERT**
- **Severity:** Medium
- **Location:** `src/app/api/register/route.ts:7`
- **Beschreibung:** Email-Format wurde nur via HTML `type="email"` validiert.
- **Fix (2026-02-10):** Zod-Schema mit `z.string().email('Ungültiges Email-Format')` auf Server-Seite
- **Validierung (2026-02-10):** Server-Side Zod-Validierung + Supabase Auth eigene Email-Validierung = doppelte Absicherung.

### BUG-7 (Medium): `redeemed_at` Timestamp wird nicht gesetzt — **GEFIXT + VALIDIERT**
- **Severity:** Medium
- **Location:** `supabase/migrations/003_atomic_invitation_redemption.sql:36`
- **Beschreibung:** Beim Einlösen eines Tokens wurde nur `redeemed_by` gesetzt, `redeemed_at` blieb `NULL`
- **Fix (2026-02-10):** `redeem_invitation()` setzt `redeemed_at = NOW()` im UPDATE
- **Validierung (2026-02-10):** Code-Review bestätigt. Beide Felder werden in einer atomaren Operation gesetzt.

### BUG-10 (Low): Kein Rate Limiting auf Registration — **NEU**
- **Severity:** Low
- **Location:** `src/app/api/register/route.ts`
- **Beschreibung:** `/api/register` hat kein Rate Limiting. Angreifer kann Registration-Versuche spammen, um Token zu validieren oder Supabase Auth zu belasten.
- **Fix-Vorschlag:** IP-basiertes Rate Limiting auf Registration-Endpoint (z.B. max. 5 Registrierungen pro IP pro Stunde)
- **Priority:** Low (Token-Entropy macht Brute-Force impraktikabel)

### BUG-11 (Low): Kein Rate Limiting auf Forgot Password — **NEU**
- **Severity:** Low
- **Location:** `src/app/(auth)/forgot-password/page.tsx:28`
- **Beschreibung:** Forgot-Password nutzt Client-Side Supabase direkt — kein Server-seitiges Rate Limiting. Angreifer kann Password-Reset-Emails spammen.
- **Fix-Vorschlag:** Server-Side API Route mit Rate Limiting (ähnlich wie `/api/login`)
- **Priority:** Low (Supabase hat eigenes Email-Rate-Limiting)

### BUG-3 (Low): Inkonsistenter Email-Enumeration-Schutz — **OFFEN**
- **Severity:** Low
- **Location:** `src/app/api/register/route.ts:51` vs. `src/app/(auth)/forgot-password/page.tsx:33`
- **Beschreibung:** Register zeigt "Diese Email-Adresse ist bereits registriert" (verrät ob Email existiert), während Forgot-Password generische Meldung zeigt
- **Fix:** Register sollte ebenfalls generische Fehlermeldung zeigen
- **Priority:** Low (inkonsistent, aber in Registrierung schwer zu vermeiden wegen UX)

### BUG-8 (Low): Auth-Callback `next` Parameter nicht validiert — **OFFEN**
- **Severity:** Low
- **Location:** `src/app/auth/callback/route.ts:8`
- **Beschreibung:** Der `next` Query-Parameter wird nicht validiert. Durch `${origin}${next}` ist ein offener Redirect zwar nicht direkt möglich, aber der Parameter sollte trotzdem auf interne Pfade beschränkt werden (Defense-in-Depth).
- **Fix:** Validierung: `next` muss mit `/` beginnen und darf kein `//` enthalten
- **Priority:** Low

---

## Bugs Summary

| Bug | Severity | Typ | Status |
|-----|----------|-----|--------|
| BUG-1: Race Condition Token-Einlösung | Critical | Security | **Gefixt + Validiert** ✅ |
| BUG-4: Rate Limiting fehlt | Critical | Security | **Gefixt + Validiert** ✅ |
| BUG-6: Invitation-Tokens öffentlich lesbar | Critical | Security | **Gefixt + Validiert** ✅ |
| BUG-2: Nur client-seitige Email-Validierung | Medium | Validation | **Gefixt + Validiert** ✅ |
| BUG-7: `redeemed_at` nicht gesetzt | Medium | Data Integrity | **Gefixt + Validiert** ✅ |
| BUG-9: Rate Limit nur per Email, nicht IP | Medium | Security | **Neu — Offen** |
| BUG-5: Session-Timeout nicht konfiguriert | Medium | Config | Offen |
| BUG-3: Inkonsistenter Email-Enumeration-Schutz | Low | Security/UX | Offen |
| BUG-8: Auth-Callback `next` nicht validiert | Low | Security | Offen |
| BUG-10: Kein Rate Limit auf Registration | Low | Security | **Neu — Offen** |
| BUG-11: Kein Rate Limit auf Forgot Password | Low | Security | **Neu — Offen** |

---

## Summary

- **Acceptance Criteria:** 9/9 bestanden ✅
- **Edge Cases:** 5/6 bestanden, 1 offen (Session-Timeout)
- **Bugs gesamt:** 11 (3 Critical, 3 Medium, 5 Low)
- **Gefixt + Validiert:** 5 (BUG-1, BUG-2, BUG-4, BUG-6, BUG-7)
- **Offen:** 6 (1 Medium-Neu, 1 Medium, 2 Low, 2 Low-Neu)
- **Feature ist BEDINGT production-ready** ✅ — Alle 3 Critical Bugs sind gefixt und validiert

---

## Recommendation

### Gefixt + Validiert (kein Handlungsbedarf):
1. ~~**BUG-1 (Critical):** Race Condition Token-Einlösung~~ ✅
2. ~~**BUG-4 (Critical):** Rate Limiting fehlt~~ ✅
3. ~~**BUG-6 (Critical):** Invitation-Tokens öffentlich lesbar~~ ✅
4. ~~**BUG-2 (Medium):** Client-seitige Email-Validierung~~ ✅
5. ~~**BUG-7 (Medium):** `redeemed_at` nicht gesetzt~~ ✅

### Sollten zeitnah gefixt werden (nächster Sprint):
6. **BUG-9 (Medium):** IP-basiertes Rate Limiting zusätzlich zum Email-basierten
7. **BUG-5 (Medium):** Session-Timeout im Supabase Dashboard auf 7 Tage konfigurieren

### Nice-to-have (Backlog):
8. **BUG-3 (Low):** Email-Enumeration-Schutz konsistent machen
9. **BUG-8 (Low):** `next` Parameter validieren
10. **BUG-10 (Low):** Rate Limiting auf Registration-Endpoint
11. **BUG-11 (Low):** Rate Limiting auf Forgot-Password (Server-Side Route)

---

## QA Retest Results (2026-02-10, Fresh Analysis)

**Tested by:** QA Engineer Agent (Code-Level Review + Live Database Verification via Supabase MCP)

### NEW Critical Finding

#### BUG-12 (Critical): SECURITY DEFINER functions callable by `anon` role
- **Severity:** Critical
- **Category:** Security / Authorization Bypass
- **Location:** `supabase/migrations/003_atomic_invitation_redemption.sql`, `supabase/migrations/004_login_rate_limiting.sql`
- **Beschreibung:** All 5 SECURITY DEFINER functions are callable by the `anon` role directly from the client. PostgreSQL grants EXECUTE to PUBLIC by default, and the migrations never revoke this.
- **Affected Functions:**
  - `clear_login_attempts(text)` — attacker can clear rate limiting for any email before each brute-force guess
  - `record_failed_login(text, text)` — attacker can lock out ANY user by recording 5 fake failed attempts
  - `check_login_rate_limit(text)` — information leak about rate limit state
  - `validate_invitation_token(text)` — can probe tokens without auth
  - `redeem_invitation(text, uuid)` — can sabotage valid invitation tokens
- **Impact:** Completely nullifies rate limiting (BUG-4 fix bypassed). Enables denial-of-service against any user account.
- **Priority:** P0 Blocker — must be fixed before deployment
- **Fix:** `REVOKE EXECUTE ON FUNCTION <name> FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION <name> TO service_role;`
  - Rate limiting functions should only be callable from server-side API routes (which use service_role)
  - `validate_invitation_token` needs to remain callable by `authenticated` role (used in registration flow from server route)

#### BUG-13 (Medium): SECURITY DEFINER functions lack `SET search_path`
- **Severity:** Medium
- **Category:** Security (Supabase Advisor Warning)
- **Location:** All 5 SECURITY DEFINER functions
- **Beschreibung:** Functions do not have `search_path` set, making them vulnerable to search path manipulation attacks
- **Fix:** Add `SET search_path = ''` to all function definitions
- **Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

#### BUG-14 (Medium): Leaked password protection disabled
- **Severity:** Medium
- **Category:** Security Configuration
- **Location:** Supabase Auth settings
- **Beschreibung:** HaveIBeenPwned leaked password protection is disabled. Users can register with known-compromised passwords.
- **Fix:** Enable in Supabase Dashboard → Auth → Settings → Password Security
- **Reference:** https://supabase.com/docs/guides/auth/password-security

#### BUG-15 (Medium): Email not normalized before rate limiting
- **Severity:** Medium
- **Category:** Security / Rate Limiting Bypass
- **Location:** `src/app/api/login/route.ts`
- **Beschreibung:** The `/api/login` route passes the email as-is to rate-limit functions, but the DB functions use `LOWER(TRIM(...))`. An attacker can use `User@Test.com` vs `user@test.com` to get separate rate-limit windows at the application level.
- **Fix:** Normalize email to lowercase + trim in `/api/login` before passing to Supabase

#### BUG-16 (Low): No INSERT policy on profiles table
- **Severity:** Low
- **Category:** Security / Documentation
- **Beschreibung:** The `profiles` table has no INSERT RLS policy. Profile creation likely relies on a database trigger from `auth.users`. This should be documented.

### Updated Bugs Summary

| Bug | Severity | Status |
|-----|----------|--------|
| BUG-12: SECURITY DEFINER functions callable by anon | **Critical** | **Neu — P0 Blocker** |
| BUG-1: Race Condition Token-Einlösung | Critical | Gefixt ✅ |
| BUG-4: Rate Limiting fehlt | Critical | Gefixt ✅ (but bypassed by BUG-12) |
| BUG-6: Invitation-Tokens öffentlich lesbar | Critical | Gefixt ✅ |
| BUG-13: SECURITY DEFINER functions lack search_path | Medium | Neu — Offen |
| BUG-14: Leaked password protection disabled | Medium | Neu — Offen |
| BUG-15: Email not normalized before rate limiting | Medium | Neu — Offen |
| BUG-9: Rate Limit nur per Email, nicht IP | Medium | Offen |
| BUG-5: Session-Timeout nicht konfiguriert | Medium | Offen |
| BUG-2: Nur client-seitige Email-Validierung | Medium | Gefixt ✅ |
| BUG-7: redeemed_at nicht gesetzt | Medium | Gefixt ✅ |
| BUG-16: No INSERT policy on profiles | Low | Neu — Offen |
| BUG-3: Inkonsistenter Email-Enumeration-Schutz | Low | Offen |
| BUG-8: Auth-Callback next nicht validiert | Low | Offen |
| BUG-10: Kein Rate Limit auf Registration | Low | Offen |
| BUG-11: Kein Rate Limit auf Forgot Password | Low | Offen |

### Updated Production-Ready Decision

**NOT READY** — BUG-12 is a P0 blocker. The rate limiting fix (BUG-4) is completely bypassed because `clear_login_attempts()` is callable by anyone via the anon key. Fix BUG-12 first, then BUG-13 and BUG-15.

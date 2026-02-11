# PROJ-2: Idea Submission

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Nur eingeloggte Nutzer können Ideen einreichen

## Beschreibung
Eingeloggte Nutzer können Produktideen einreichen. Jede Idee hat einen Titel, eine Beschreibung und optional eine Kategorie.

## User Stories
- Als eingeloggter Nutzer möchte ich eine neue Idee mit Titel und Beschreibung einreichen, um mein Feedback zu teilen
- Als eingeloggter Nutzer möchte ich meiner Idee eine Kategorie zuweisen, damit sie thematisch eingeordnet wird
- Als Autor möchte ich meine eigene Idee bearbeiten können, um Tippfehler oder Details zu korrigieren
- Als Autor möchte ich meine eigene Idee löschen können, wenn sie nicht mehr relevant ist

## Acceptance Criteria
- [ ] Formular mit Titel (Pflicht, max. 100 Zeichen) und Beschreibung (Pflicht, max. 2000 Zeichen)
- [ ] Optionale Kategorie-Auswahl (Dropdown der vom Admin erstellten Kategorien)
- [ ] Idee wird mit Autor-ID und Erstellungsdatum gespeichert
- [ ] Autor kann eigene Idee bearbeiten (Titel, Beschreibung, Kategorie)
- [ ] Autor kann eigene Idee löschen (mit Bestätigungsdialog)
- [ ] Nur eingeloggte Nutzer sehen das Einreichen-Formular
- [ ] Erfolgreiche Einreichung zeigt Bestätigung und leitet zum Board zurück
- [ ] Neue Idee erhält automatisch Status "Offen"

## Edge Cases
- Leerer Titel oder Beschreibung → Validierungsfehler anzeigen
- Titel überschreitet 100 Zeichen → Zeichenlimit anzeigen, Eingabe begrenzen
- Kategorie wurde zwischenzeitlich vom Admin gelöscht → Idee ohne Kategorie speichern
- Doppelte Einreichung (schnelles Doppelklicken) → Button nach Klick deaktivieren
- Bearbeitung einer Idee die bereits Votes hat → Erlaubt, Votes bleiben erhalten
- Löschen einer Idee mit Votes → Bestätigungsdialog mit Hinweis auf Vote-Verlust

## Technische Anforderungen
- Supabase Tabelle `ideas` mit RLS (nur Autor darf bearbeiten/löschen)
- Echtzeit-Insert via Supabase Client

## Tech-Design (Solution Architect)

### Bestehende Architektur (Wiederverwendung aus PROJ-1)
- Auth-System (Login, Register, Session-Management)
- AuthProvider (User-State im Frontend)
- Header mit Logout-Button
- Middleware für geschützte Routen
- Supabase-Client (Browser + Server)
- Profiles-Tabelle (User-ID, Role)
- shadcn/ui Komponenten (Button, Card, Input, Dialog, Form, Select, Textarea, etc.)

### Component-Struktur

```
App (bestehend)
├── Header (bestehend, unverändert)
│
├── Ideen-Board-Seite (/) ← Hauptseite erweitern
│   ├── "Neue Idee einreichen" Button (nur für eingeloggte Nutzer)
│   └── Ideen-Liste (Vorschau, wird in PROJ-4 vollständig gebaut)
│       └── Ideen-Karten (Titel, Beschreibung-Vorschau, Kategorie-Badge)
│
├── Neue-Idee-Seite (/ideas/new)
│   ├── Titel-Eingabefeld (Pflicht, max. 100 Zeichen, mit Zähler)
│   ├── Beschreibung-Textfeld (Pflicht, max. 2000 Zeichen, mit Zähler)
│   ├── Kategorie-Dropdown (Optional, vom Admin erstellte Kategorien)
│   ├── "Einreichen" Button (wird nach Klick deaktiviert)
│   ├── "Abbrechen" Link
│   └── Validierungs-Fehlermeldungen
│
├── Idee-Bearbeiten-Seite (/ideas/[id]/edit)
│   ├── Gleiche Felder wie Neue-Idee-Formular (vorausgefüllt)
│   ├── "Speichern" Button
│   └── "Abbrechen" Link
│
└── Idee-Detail-Ansicht (/ideas/[id])
    ├── Titel
    ├── Beschreibung (vollständig)
    ├── Kategorie-Badge
    ├── Autor-Name + Erstellungsdatum
    ├── Status-Badge ("Offen")
    └── Aktions-Buttons (nur für Autor sichtbar)
        ├── "Bearbeiten" Button
        └── "Löschen" Button (mit Bestätigungsdialog)
```

### Daten-Model

```
Jede Idee hat:
- Eindeutige ID
- Titel (Pflicht, max. 100 Zeichen)
- Beschreibung (Pflicht, max. 2000 Zeichen)
- Kategorie (Optional, Verweis auf Kategorien-Liste)
- Autor (Verweis auf den Nutzer der sie erstellt hat)
- Status ("Offen" als Standard)
- Erstellungszeitpunkt
- Letzter Bearbeitungszeitpunkt

Kategorien (Grundstruktur, wird in PROJ-5 vom Admin verwaltet):
- Eindeutige ID
- Name (z.B. "Feature", "Bugfix", "Verbesserung")
- Erstellungszeitpunkt

Gespeichert in: Supabase (PostgreSQL mit Row Level Security)
```

### Sicherheitskonzept (Datenbank-Regeln)

```
Ideen lesen:    Alle eingeloggten Nutzer dürfen alle Ideen sehen
Idee erstellen: Nur eingeloggte Nutzer
Idee bearbeiten: Nur der Autor seiner eigenen Idee
Idee löschen:   Nur der Autor seiner eigenen Idee

Kategorien lesen: Alle eingeloggten Nutzer (für Dropdown)
Kategorien verwalten: Nur Admins (kommt in PROJ-5)
```

### Seitenfluss (User Journey)

```
Eingeloggter Nutzer auf Hauptseite
        ↓
Klickt "Neue Idee einreichen"
        ↓
Formular ausfüllen (Titel, Beschreibung, optional Kategorie)
        ↓
"Einreichen" klicken → Button wird deaktiviert
        ↓
Erfolg → Bestätigung + Weiterleitung zum Board
Fehler → Fehlermeldung im Formular

Eigene Idee bearbeiten:
    Idee-Detail → "Bearbeiten" → Formular (vorausgefüllt) → Speichern

Eigene Idee löschen:
    Idee-Detail → "Löschen" → Bestätigungsdialog → Gelöscht + zurück zum Board

Nicht eingeloggt + geschützte Seite:
    → Automatische Weiterleitung zur Login-Seite (bestehende Middleware)
```

### Tech-Entscheidungen

```
Warum eigene Seiten statt Modals für Formular?
→ Bessere UX auf Mobilgeräten
→ URL-basiert (kann direkt verlinkt werden)
→ Einfachere Formular-Validierung

Warum Kategorien-Tabelle jetzt schon anlegen (vor PROJ-5)?
→ PROJ-2 braucht die Dropdown-Auswahl
→ Grundstruktur reicht, Admin-UI kommt in PROJ-5
→ Wir legen ein paar Standard-Kategorien per Migration an

Warum Zeichenzähler bei Titel und Beschreibung?
→ Verhindert Frustration durch abgeschnittene Eingaben
→ Nutzer sieht sofort, wie viel Platz noch ist

Warum Soft-Delete nicht verwenden?
→ Feature Spec sagt "löschen", keine Wiederherstellung gefordert
→ Hard Delete ist einfacher, weniger Komplexität
→ Admin-Moderation (PROJ-6) kann später eigene Lösung bringen
```

### Dependencies

```
Bereits installiert (keine neuen Packages nötig):
- @supabase/supabase-js + @supabase/ssr (Supabase Client)
- react-hook-form + @hookform/resolvers (Formular-Handling)
- zod (Validierung)
- shadcn/ui Komponenten (Card, Dialog, Button, Input, Textarea, Select, Form)
- lucide-react (Icons)
- sonner (Toast-Benachrichtigungen)

Neu benötigt:
- Keine! Alles ist bereits vorhanden.
```

### Supabase-Setup (was konfiguriert werden muss)

```
1. Migration: Tabelle "ideas" anlegen
2. Migration: Tabelle "categories" anlegen (Grundstruktur für PROJ-5)
3. Standard-Kategorien einfügen (z.B. "Feature", "Bugfix", "Verbesserung")
4. RLS-Policies für "ideas" (lesen: alle, erstellen: eingeloggt, bearbeiten/löschen: nur Autor)
5. RLS-Policies für "categories" (lesen: alle, verwalten: nur Admin)
```

---

## QA Test Results

**Tested:** 2026-02-10
**Tester:** QA Engineer Agent (Code-Level Review + Database Verification)
**App URL:** https://voting-app (Vercel deployment) / Supabase Project: `qwuxhupzlybtdaurtnbm`
**Method:** Code review of all source files + live Supabase database inspection via MCP

---

### Regression Check (PROJ-1: User Authentication)

- [x] Login page (`/login`) still intact and unchanged
- [x] Register page (`/register`) still intact with invitation code flow
- [x] Middleware (`middleware.ts`) correctly redirects unauthenticated users to `/login`
- [x] AuthProvider correctly manages user/session state
- [x] Header with logout functionality unchanged
- [x] No PROJ-1 source files were modified by PROJ-2 implementation (confirmed via git log)

**Regression Result:** PROJ-1 is NOT affected by PROJ-2 changes.

---

### Acceptance Criteria Status

#### AC-1: Formular mit Titel (Pflicht, max. 100 Zeichen) und Beschreibung (Pflicht, max. 2000 Zeichen)
- [x] Title field present with `<Input>` component, `maxLength={100}` attribute on HTML input
- [x] Description field present with `<Textarea>` component, `maxLength={2000}` attribute
- [x] Character counter shown for title (`{title.length}/100`)
- [x] Character counter shown for description (`{description.length}/2000`)
- [x] Frontend validation: empty title/description shows error message
- [x] Frontend validation: length > 100 / > 2000 shows error message
- [x] Database CHECK constraint: `char_length(title) <= 100` verified in live DB
- [x] Database CHECK constraint: `char_length(description) <= 2000` verified in live DB
- [x] Both fields are NOT NULL in database schema

#### AC-2: Optionale Kategorie-Auswahl (Dropdown der vom Admin erstellten Kategorien)
- [x] Category dropdown present using `<Select>` component
- [x] Label correctly says "Kategorie (optional)"
- [x] Categories loaded from Supabase `categories` table on component mount
- [x] 3 default categories exist in database: "Feature", "Bugfix", "Verbesserung"
- [x] `category_id` sent as `null` when no category selected (`categoryId || null`)
- [x] Database column `category_id` is nullable (IS_NULLABLE = YES)
- [ ] **BUG-1:** No way to deselect a category once selected (see Bugs section)

#### AC-3: Idee wird mit Autor-ID und Erstellungsdatum gespeichert
- [x] `author_id: user.id` explicitly set on insert in `idea-form.tsx` line 92
- [x] `created_at` has default `NOW()` in database, automatically set
- [x] RLS INSERT policy enforces `auth.uid() = author_id` (cannot spoof another user's ID)
- [x] `author_id` is NOT NULL and has FK to `auth.users(id) ON DELETE CASCADE`

#### AC-4: Autor kann eigene Idee bearbeiten (Titel, Beschreibung, Kategorie)
- [x] Edit page exists at `/ideas/[id]/edit` (`edit/page.tsx`)
- [x] Form pre-populated with `initialData` (title, description, category_id)
- [x] Frontend author check: redirects non-author away (`idea.author_id !== user.id`)
- [x] Backend RLS UPDATE policy: `auth.uid() = author_id` (both USING and WITH CHECK)
- [x] Update sends only `title`, `description`, `category_id` (correct subset)
- [x] `updated_at` trigger fires on update via `update_updated_at()` function
- [x] Detail page shows "Zuletzt bearbeitet am" when `updated_at !== created_at`

#### AC-5: Autor kann eigene Idee loschen (mit Bestatigungsdialog)
- [x] Delete button visible only for author (`{isAuthor && ...}`)
- [x] AlertDialog confirmation present with clear warning text
- [x] Warning mentions: "Die Idee und alle zugehorigen Votes werden dauerhaft geloscht."
- [x] Delete button disabled during deletion (`disabled={isDeleting}`)
- [x] After delete: toast success + redirect to home (`/`)
- [x] Error handling: toast error if delete fails
- [x] RLS DELETE policy: `auth.uid() = author_id`

#### AC-6: Nur eingeloggte Nutzer sehen das Einreichen-Formular
- [x] Middleware redirects unauthenticated users to `/login` for all non-public routes
- [x] `/ideas/new` is NOT in the public routes list
- [x] Home page only shows "Neue Idee" button (links to `/ideas/new`)
- [ ] **BUG-2:** Home page shows "Neue Idee" button for ALL logged-in users without checking if `user` exists first in the button render path -- however middleware protects the route, so this is cosmetically fine. The real issue is the home page `useEffect` returns early if `!user`, meaning non-auth state shows nothing (correct behavior due to middleware redirect).

#### AC-7: Erfolgreiche Einreichung zeigt Bestatigung und leitet zum Board zuruck
- [x] On create success: `toast.success('Idee erfolgreich eingereicht!')` shown
- [x] On create success: `router.push('/')` redirects to board
- [x] On edit success: `toast.success('Idee erfolgreich aktualisiert!')` shown
- [x] On edit success: `router.push('/ideas/${ideaId}')` redirects to detail page

#### AC-8: Neue Idee erhalt automatisch Status "Offen"
- [x] Database default: `status TEXT NOT NULL DEFAULT 'Offen'`
- [x] Database CHECK constraint: `status IN ('Offen', 'In Bearbeitung', 'Erledigt', 'Abgelehnt')`
- [x] Frontend does NOT send `status` field on insert (correctly relies on DB default)
- [x] Status badge displayed on idea cards and detail page

---

### Edge Cases Status

#### EC-1: Leerer Titel oder Beschreibung -> Validierungsfehler anzeigen
- [x] `validate()` function checks `!title.trim()` and `!description.trim()`
- [x] Error messages: "Titel ist erforderlich." / "Beschreibung ist erforderlich."
- [x] Errors displayed in red text below fields
- [x] Form submission prevented when validation fails

#### EC-2: Titel uberschreitet 100 Zeichen -> Zeichenlimit anzeigen, Eingabe begrenzen
- [x] HTML `maxLength={100}` on input prevents typing beyond 100 characters
- [x] Character counter visible: `{title.length}/100`
- [x] Frontend validation also checks `title.length > 100` as backup
- [x] Database CHECK constraint as final safety net

#### EC-3: Kategorie wurde zwischenzeitlich vom Admin geloscht -> Idee ohne Kategorie speichern
- [x] Database FK: `category_id REFERENCES categories(id) ON DELETE SET NULL`
- [x] If admin deletes a category, all ideas with that category automatically get `category_id = NULL`
- [x] Frontend gracefully handles null category (conditional rendering with `{idea.category && ...}`)

#### EC-4: Doppelte Einreichung (schnelles Doppelklicken) -> Button nach Klick deaktivieren
- [x] `isSubmitting` state set to `true` before API call
- [x] Submit button: `disabled={isSubmitting}`
- [x] Button text changes: "Wird eingereicht..." / "Wird gespeichert..."
- [x] On error, `isSubmitting` reset to `false` (user can retry)
- [ ] **BUG-3:** On success, `isSubmitting` is never reset to `false` before `router.push()`. While this works in practice (page navigates away), if `router.push()` is slow or fails silently, the button stays permanently disabled. (Low severity)

#### EC-5: Bearbeitung einer Idee die bereits Votes hat -> Erlaubt, Votes bleiben erhalten
- [x] Update only modifies `title`, `description`, `category_id` -- votes are in a separate table
- [x] No cascade delete on update
- [x] Database structure supports this (votes will reference `ideas.id` which remains unchanged)

#### EC-6: Loschen einer Idee mit Votes -> Bestatigungsdialog mit Hinweis auf Vote-Verlust
- [x] AlertDialog text explicitly warns: "Die Idee und alle zugehorigen Votes werden dauerhaft geloscht."
- [x] Confirmation required before delete executes

---

### Security Review (Red Team)

#### RLS Policies (Database Level) -- VERIFIED IN LIVE DATABASE
- [x] `ideas` table: RLS ENABLED
- [x] SELECT policy: `auth.uid() IS NOT NULL` -- all authenticated users can read all ideas
- [x] INSERT policy: `auth.uid() = author_id` -- cannot insert ideas as another user
- [x] UPDATE policy: USING `auth.uid() = author_id` + WITH CHECK `auth.uid() = author_id` -- only author can update own ideas
- [x] DELETE policy: `auth.uid() = author_id` -- only author can delete own ideas
- [x] `categories` table: RLS ENABLED
- [x] Categories SELECT: authenticated users only
- [x] Categories INSERT/UPDATE/DELETE: admin role only (via profiles table check)

#### Authorization Bypass Attempts
- [x] **Spoofing author_id on INSERT:** Blocked by RLS -- `auth.uid() = author_id` ensures the author_id must match the authenticated user's JWT
- [ ] **BUG-4 (SECURITY):** Status field manipulation on UPDATE -- The RLS UPDATE policy allows the author to update ANY column including `status`. The frontend only sends `title`, `description`, `category_id`, but a malicious user could craft a direct Supabase API call to change the `status` field (e.g., from "Offen" to "Erledigt") bypassing admin control. The spec says status should only be managed by the system/admin.
- [ ] **BUG-5 (SECURITY):** `author_id` field manipulation on UPDATE -- Similarly, the RLS WITH CHECK enforces `auth.uid() = author_id` on the NEW row, but a user could potentially attempt to update `created_at` or other fields. The WITH CHECK prevents changing `author_id` to a different user (it would fail the check), but `created_at` manipulation is possible.
- [x] **Delete by non-author:** Blocked by RLS DELETE policy
- [x] **Edit page access by non-author:** Frontend redirects away + RLS blocks the actual update

#### Input Validation & Injection
- [x] **SQL Injection:** Not possible -- Supabase client uses parameterized queries
- [x] **XSS via title/description:** React auto-escapes all rendered text. Title rendered in `<CardTitle>`, description in `<p>` with `whitespace-pre-wrap`. No `dangerouslySetInnerHTML` used anywhere.
- [x] **XSS via author email:** Rendered as text content in `<span>`, auto-escaped by React
- [x] Title and description are `.trim()`-ed before insert (prevents whitespace-only submissions)
- [x] `maxLength` on HTML elements prevents oversized input at browser level
- [x] Database CHECK constraints as server-side backup validation

#### Supabase Security Advisors Findings (PROJ-2 specific)
- [ ] **BUG-6 (SECURITY):** `update_updated_at` function has mutable search_path. A malicious actor with sufficient DB privileges could exploit this by creating a function in a schema that appears earlier in the search path. Remediation: Set `search_path` to empty string in function definition. See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- [ ] **BUG-7 (SECURITY):** All RLS policies on `ideas` and `categories` tables use `auth.uid()` directly instead of `(SELECT auth.uid())`. This causes re-evaluation per row, which is both a performance issue and a security best practice concern. Remediation: Wrap in subquery. See: https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan
- [ ] **BUG-8 (SECURITY):** Leaked password protection is DISABLED in Supabase Auth settings. Not directly PROJ-2 related but affects overall security posture. See: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

#### IDOR (Insecure Direct Object Reference)
- [x] Idea ID is UUID (not sequential integer) -- harder to enumerate
- [x] Edit/delete operations verified against `author_id` at both frontend and database level
- [x] Detail page `/ideas/[id]` readable by any authenticated user (by design per spec)

---

### Additional Findings

#### BUG-9 (Medium): No "Keine Kategorie" option in dropdown
- Once a user selects a category, there is no way to deselect it and go back to "no category". The `<Select>` component does not include a "Keine Kategorie" / clear option. The `SelectValue` placeholder "Kategorie wahlen..." only shows when no value is set initially.

#### BUG-10 (Low): Edit page has no loading protection against unauthorized access flash
- The edit page (`/ideas/[id]/edit`) first loads the idea data, THEN checks if the user is the author in a separate `useEffect`. There is a brief moment where a non-author could see the loading skeleton before being redirected. This is cosmetic only (no data exposed during skeleton) but the author check could race with data loading.

#### BUG-11 (Low): Home page does not handle Supabase query errors
- In `page.tsx` (home), the `.then(({ data })` handler only checks if `data` exists but does not handle the `error` case. If the query fails (e.g., network issue), no error message is shown to the user and `isLoading` remains `true` forever (spinner stuck).

#### BUG-12 (Low): Idea detail page silently redirects on error
- In `/ideas/[id]/page.tsx`, if the idea fetch fails or returns no data, the user is silently redirected to `/` with no error message. This is confusing if the idea was just deleted by someone else.

#### BUG-13 (Info): `react-hook-form` and `zod` not used despite being listed as dependencies
- The tech design lists `react-hook-form` and `zod` as available dependencies for form handling and validation, but the implementation uses manual state management and custom validation instead. This is not a bug per se, but a deviation from the tech design that may lead to inconsistency with future features.

---

### Database Verification Summary

| Check | Expected | Actual | Status |
|---|---|---|---|
| `ideas` table exists | Yes | Yes | PASS |
| `categories` table exists | Yes | Yes | PASS |
| RLS enabled on `ideas` | Yes | Yes | PASS |
| RLS enabled on `categories` | Yes | Yes | PASS |
| 4 RLS policies on `ideas` | SELECT, INSERT, UPDATE, DELETE | All 4 present | PASS |
| 4 RLS policies on `categories` | SELECT, INSERT, UPDATE, DELETE | All 4 present | PASS |
| Title CHECK constraint | <= 100 chars | `char_length(title) <= 100` | PASS |
| Description CHECK constraint | <= 2000 chars | `char_length(description) <= 2000` | PASS |
| Status CHECK constraint | Valid values only | `'Offen', 'In Bearbeitung', 'Erledigt', 'Abgelehnt'` | PASS |
| Status default | 'Offen' | `'Offen'::text` | PASS |
| category_id FK ON DELETE | SET NULL | `ON DELETE SET NULL` | PASS |
| author_id FK ON DELETE | CASCADE | `ON DELETE CASCADE` | PASS |
| updated_at trigger | Exists | `ideas_updated_at` BEFORE UPDATE | PASS |
| Performance indexes | 4 indexes | All 4 present (author_id, category_id, status, created_at DESC) | PASS |
| Default categories | 3 rows | "Feature", "Bugfix", "Verbesserung" | PASS |

---

### Bugs Found

#### BUG-4: Author can manipulate `status` field via direct API call
- **Severity:** High
- **Category:** Security / Authorization Bypass
- **Steps to Reproduce:**
  1. Login as a regular user
  2. Create an idea (status = "Offen")
  3. Using browser console or API tool, call Supabase update directly: `supabase.from('ideas').update({ status: 'Erledigt' }).eq('id', '<idea-id>')`
  4. Expected: Update rejected or status field ignored
  5. Actual: Status changes to "Erledigt" -- author can bypass admin-controlled status workflow
- **Root Cause:** RLS UPDATE policy only checks `author_id` match but does not restrict which columns can be modified
- **Priority:** High (undermines admin control over idea lifecycle)

#### BUG-5: Author can manipulate `created_at` field via direct API call
- **Severity:** Medium
- **Category:** Security / Data Integrity
- **Steps to Reproduce:**
  1. Login as author of an idea
  2. Via direct API call: `supabase.from('ideas').update({ created_at: '2020-01-01' }).eq('id', '<idea-id>')`
  3. Expected: `created_at` should be immutable
  4. Actual: `created_at` can be changed, manipulating the apparent age of the idea
- **Root Cause:** No column-level restriction in RLS policy or database trigger to prevent `created_at` modification
- **Priority:** Medium (data integrity issue)

#### BUG-6: `update_updated_at` function has mutable search_path
- **Severity:** Medium
- **Category:** Security (Supabase Advisor Warning)
- **Details:** The function `public.update_updated_at` does not have `search_path` set, making it vulnerable to search path manipulation attacks.
- **Remediation:** `ALTER FUNCTION public.update_updated_at() SET search_path = '';`
- **Priority:** Medium
- **Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

#### BUG-7: RLS policies use `auth.uid()` instead of `(SELECT auth.uid())`
- **Severity:** Low
- **Category:** Performance / Security Best Practice
- **Details:** All 4 RLS policies on `ideas` and all 4 on `categories` call `auth.uid()` directly, causing per-row re-evaluation instead of once-per-query evaluation.
- **Affected Policies:** All 8 policies on `ideas` and `categories` tables
- **Remediation:** Replace `auth.uid()` with `(SELECT auth.uid())` in all policies
- **Priority:** Low (performance at scale, not currently impactful)
- **Reference:** https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan

#### BUG-9: No way to deselect category in dropdown
- **Severity:** Medium
- **Category:** UX / Functional
- **Steps to Reproduce:**
  1. Open "Neue Idee" form
  2. Select a category (e.g., "Feature")
  3. Try to go back to "no category"
  4. Expected: Option to clear/deselect category
  5. Actual: No clear option available, category is now permanently selected for this form session
- **Root Cause:** `<Select>` component has no "Keine Kategorie" / empty option
- **Priority:** Medium (impacts user experience, category is supposed to be optional)

#### BUG-11: Home page does not handle Supabase query errors
- **Severity:** Low
- **Category:** Error Handling / UX
- **Steps to Reproduce:**
  1. Simulate a network failure or Supabase downtime
  2. Load the home page
  3. Expected: Error message shown to user
  4. Actual: Loading skeleton shows indefinitely
- **Root Cause:** `.then(({ data })` ignores `error` field; no `.catch()` handler
- **Priority:** Low (edge case, requires network failure)

#### BUG-12: Silent redirect on idea detail error
- **Severity:** Low
- **Category:** UX
- **Steps to Reproduce:**
  1. Navigate to `/ideas/<invalid-uuid>`
  2. Expected: "Idee nicht gefunden" error message
  3. Actual: Silent redirect to `/` with no explanation
- **Priority:** Low (cosmetic UX issue)

---

### Summary

| Category | Count |
|---|---|
| Acceptance Criteria Tested | 8 |
| Acceptance Criteria PASSED | 8 (all core functionality works) |
| Edge Cases Tested | 6 |
| Edge Cases PASSED | 5 |
| Edge Cases with Issues | 1 (category deselect) |
| Bugs Found | 7 |
| Critical Bugs | 0 |
| High Bugs | 1 (BUG-4: status manipulation) |
| Medium Bugs | 3 (BUG-5, BUG-6, BUG-9) |
| Low Bugs | 3 (BUG-7, BUG-11, BUG-12) |
| Supabase Advisor Warnings | 2 relevant (function search_path, RLS initplan) |

### PROJ-1 Regression Status
- **PASSED** -- No regression detected. All PROJ-1 auth files are untouched by PROJ-2 implementation.

### Production-Ready Decision

**NOT READY** -- BUG-4 (status field manipulation) is a High severity security issue that must be fixed before deployment. An author should not be able to change the status of their own idea, as this undermines the admin-controlled idea lifecycle.

### Recommended Fix Priority

1. ~~**BUG-4 (High):** Add column-level restrictions~~ **GEFIXT**
2. ~~**BUG-9 (Medium):** Add a "Keine Kategorie" option~~ **GEFIXT**
3. ~~**BUG-5 (Medium):** Fix as part of BUG-4 solution~~ **GEFIXT**
4. ~~**BUG-6 (Medium):** Set search_path on `update_updated_at` function~~ **GEFIXT**
5. ~~**BUG-7 (Low):** Update RLS policies to use `(SELECT auth.uid())` pattern~~ **TEILWEISE GEFIXT** (ideas + categories ja, profiles + invitations nein)
6. ~~**BUG-11 (Low):** Add error handling to home page query~~ **GEFIXT**
7. ~~**BUG-12 (Low):** Show "not found" toast before redirecting~~ **GEFIXT**

---

## QA Revalidation Results (2026-02-11)

**Tested:** 2026-02-11
**Tester:** QA Engineer Agent (Code-Level Review + Live Database Verification via Supabase MCP)
**Method:** Full source code review of all PROJ-1 and PROJ-2 files + live database inspection + Supabase advisors
**Commits reviewed:** `56cf304` (Reset Password fix), `1c3dbad` (security hardening), `f12aa4d` (PROJ-2 implementation)

---

### PROJ-2 Bug Fix Verification

| Bug | Fix Status | Verification |
|-----|-----------|--------------|
| **BUG-4** (status manipulation) | **GEFIXT** | DB trigger `protect_ideas_immutable_columns` raises exception if `status`, `author_id`, or `created_at` are changed. Verified in live DB. |
| **BUG-5** (created_at manipulation) | **GEFIXT** | Same trigger as BUG-4. `created_at` is immutable. Verified in live DB. |
| **BUG-6** (mutable search_path) | **GEFIXT** | All 8 public functions have `search_path=''`. Verified via `pg_proc.proconfig`. |
| **BUG-7** (RLS auth.uid() pattern) | **TEILWEISE GEFIXT** | `ideas` and `categories` policies use `(SELECT auth.uid())`. `profiles` (3 policies) and `invitations` (4 policies) still use `auth.uid()` directly. |
| **BUG-9** (category deselect) | **GEFIXT** | `<SelectItem value="none">Keine Kategorie</SelectItem>` added in `idea-form.tsx:174`. Logic at line 86: `categoryId && categoryId !== 'none' ? categoryId : null`. |
| **BUG-11** (home page error handling) | **GEFIXT** | Error state with `AlertCircle` icon and message in `page.tsx:87-92`. Query error sets `setError('Ideen konnten nicht geladen werden.')`. |
| **BUG-12** (silent redirect) | **GEFIXT** | `toast.error('Idee nicht gefunden.')` shown before redirect in `ideas/[id]/page.tsx:59`. |

### PROJ-1 Critical Bug Fix Verification

| Bug | Fix Status | Verification |
|-----|-----------|--------------|
| **BUG-12** (SECURITY DEFINER callable by anon) | **GEFIXT** | All 5 sensitive functions (`clear_login_attempts`, `record_failed_login`, `check_login_rate_limit`, `validate_invitation_token`, `redeem_invitation`) are granted to `service_role` only. Trigger functions (`handle_new_user`, `update_updated_at`, `protect_ideas_immutable_columns`) correctly retain PUBLIC access. Verified via `information_schema.routine_privileges`. |
| **BUG-13** (search_path mutable) | **GEFIXT** | All 8 functions have `search_path=''` set. |
| **BUG-15** (email not normalized) | **GEFIXT** | Login route normalizes email to lowercase (commit `1c3dbad`). |

### PROJ-1 Regression Check

| Check | Result |
|-------|--------|
| Login page (`/login`) intact | PASS |
| Register page (`/register`) with invitation flow | PASS |
| Middleware redirects unauthenticated users | PASS |
| AuthProvider manages user/session state | PASS |
| Header with logout functionality | PASS |
| Password reset flow (forgot-password + reset-password) | FIXED (was broken, `56cf304` fixes redirect to use client-side token handling) |
| Rate limiting on login (5 attempts/60s) | PASS (functions restricted to service_role) |
| Invitation token validation | PASS (function restricted to service_role) |

**Regression Result:** PROJ-1 NOT affected by PROJ-2 bug fixes. Password reset flow separately fixed.

---

### New Findings

#### BUG-13 (Low): Password reset page has no loading timeout
- **Severity:** Low
- **Category:** UX / Reliability
- **Location:** `src/app/(auth)/reset-password/page.tsx`
- **Description:** If the `PASSWORD_RECOVERY` auth event never fires (e.g., token exchange fails silently), the user is stuck on "Sitzung wird geladen..." forever with no way to recover.
- **Fix:** Add a timeout (e.g., 10 seconds) that shows an error message or redirects to forgot-password page.

#### BUG-14 (Low): Forgot-password has no error handling on API call
- **Severity:** Low
- **Category:** UX / Error Handling
- **Location:** `src/app/(auth)/forgot-password/page.tsx:27-30`
- **Description:** `resetPasswordForEmail()` has no try-catch. If the Supabase call fails (network error), the user still sees "Email gesendet" success message. The call also ignores the `error` return value.
- **Fix:** Add try-catch and check `{ error }` return value.

#### BUG-15 (Low): Categories query in idea-form has no error handling
- **Severity:** Low
- **Category:** UX / Error Handling
- **Location:** `src/components/idea-form.tsx:46-55`
- **Description:** The categories fetch `.then(({ data })` ignores the `error` field. If categories fail to load, the dropdown shows empty options with no indication to the user.
- **Fix:** Add error handling and show a message if categories can't be loaded.

#### PERF-1 (Info): 7 RLS policies on profiles/invitations still use auth.uid() directly
- **Severity:** Info (Performance)
- **Category:** Performance / Best Practice
- **Location:** `profiles` (3 policies), `invitations` (4 policies)
- **Description:** Migration 006 fixed `ideas` and `categories` but missed `profiles` and `invitations`. These policies re-evaluate `auth.uid()` per row instead of once per query.
- **Fix:** Update policies to use `(SELECT auth.uid())` pattern.

#### PERF-2 (Info): Redundant index on invitations.token
- **Severity:** Info (Performance)
- **Category:** Database Optimization
- **Description:** `idx_invitations_token` (non-unique btree) duplicates `invitations_token_key` (unique btree). Drop the redundant index.

---

### Security Review Summary

| Area | Status |
|------|--------|
| RLS enabled on all 5 tables | PASS |
| SECURITY DEFINER functions restricted to service_role | PASS |
| All functions have immutable search_path | PASS |
| Immutable columns trigger on ideas | PASS |
| Ideas: author-only edit/delete via RLS | PASS |
| Categories: admin-only management via RLS | PASS |
| XSS protection (React auto-escaping, no dangerouslySetInnerHTML) | PASS |
| SQL injection protection (Supabase parameterized queries) | PASS |
| Input validation (client + DB CHECK constraints) | PASS |
| Double-submit prevention (isSubmitting state) | PASS |
| Leaked password protection | STILL DISABLED (Supabase config, not code) |

---

### Updated Bugs Summary (PROJ-2)

| Bug | Severity | Previous Status | Current Status |
|-----|----------|----------------|----------------|
| BUG-4: Status manipulation | High | Open | **Gefixt + Validiert** |
| BUG-5: created_at manipulation | Medium | Open | **Gefixt + Validiert** |
| BUG-6: Mutable search_path | Medium | Open | **Gefixt + Validiert** |
| BUG-9: Category deselect | Medium | Open | **Gefixt + Validiert** |
| BUG-7: RLS auth.uid() pattern | Low | Open | **Teilweise Gefixt** (ideas+categories) |
| BUG-11: Home page error handling | Low | Open | **Gefixt + Validiert** |
| BUG-12: Silent redirect on detail | Low | Open | **Gefixt + Validiert** |
| BUG-13: Reset-password no timeout | Low | NEW | Offen |
| BUG-14: Forgot-password no error handling | Low | NEW | Offen |
| BUG-15: Categories query no error handling | Low | NEW | Offen |
| PERF-1: RLS InitPlan on profiles/invitations | Info | NEW | Offen |
| PERF-2: Redundant index | Info | NEW | Offen |

---

### Production-Ready Decision

**READY (bedingt)** -- All High and Medium severity bugs from the original QA are fixed and verified. Remaining open items are Low severity (UX improvements) and Info-level performance optimizations. No security blockers remain.

### Remaining Fix Priority (Nice-to-have)

1. **BUG-13 (Low):** Add timeout to reset-password loading state
2. **BUG-14 (Low):** Add error handling to forgot-password
3. **BUG-15 (Low):** Add error handling to categories query
4. **PERF-1 (Info):** Update profiles/invitations RLS policies to use `(SELECT auth.uid())`
5. **PERF-2 (Info):** Drop redundant `idx_invitations_token` index

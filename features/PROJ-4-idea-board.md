# PROJ-4: Idea Board

## Status: ✅ Deployed (2026-02-11)

**Production URL:** <https://voting-app-kappa-blush.vercel.app>

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Board nur für eingeloggte Nutzer sichtbar
- Benötigt: PROJ-2 (Idea Submission) - Ideen zum Anzeigen
- Benötigt: PROJ-3 (Voting System) - Vote-Counts anzeigen

## Beschreibung
Hauptansicht der App: Ein Board das alle eingereichten Ideen anzeigt. Nutzer können nach Kategorien filtern, nach Votes oder Datum sortieren und den Status jeder Idee sehen.

## User Stories
- Als Nutzer möchte ich alle eingereichten Ideen auf einem Board sehen, um einen Überblick zu bekommen
- Als Nutzer möchte ich Ideen nach Kategorie filtern, um nur relevante Ideen zu sehen
- Als Nutzer möchte ich Ideen nach Votes sortieren, um die beliebtesten Ideen zuerst zu sehen
- Als Nutzer möchte ich Ideen nach Datum sortieren, um die neuesten Ideen zu finden
- Als Nutzer möchte ich Ideen nach Status filtern, um z.B. nur offene Ideen zu sehen
- Als Nutzer möchte ich eine Idee anklicken, um die vollständige Beschreibung zu lesen

## Acceptance Criteria
- [ ] Board zeigt alle Ideen als Karten/Liste (Titel, Beschreibung-Preview, Vote-Count, Status, Kategorie)
- [ ] Filter nach Kategorie (Dropdown oder Chips)
- [ ] Filter nach Status (Offen, Geplant, In Arbeit, Erledigt)
- [ ] Sortierung: "Meiste Votes" (default), "Neueste zuerst", "Älteste zuerst"
- [ ] Ideen-Detail-Ansicht bei Klick (vollständige Beschreibung, Autor, Datum, Votes)
- [ ] Responsive Design (Mobile + Desktop)
- [ ] Leerer Zustand: Hinweis "Noch keine Ideen — sei der Erste!" mit Link zum Einreichen
- [ ] Pagination oder Infinite Scroll bei >20 Ideen

## Edge Cases
- Keine Ideen vorhanden → Empty State mit Call-to-Action
- Alle Ideen gefiltert → "Keine Ideen in dieser Kategorie/Status"
- Idee wird gelöscht während Board offen → Karte entfernen (Realtime Subscription)
- Sehr langer Titel/Beschreibung → Text truncaten mit "..." und Tooltip/Detail-Ansicht
- Langsame Verbindung → Skeleton-Loading anzeigen

## Technische Anforderungen
- Supabase Realtime Subscription für Live-Updates
- Server-Side Rendering für initiale Ansicht (Next.js)
- Client-seitige Filter und Sortierung

---

## Tech Design (Solution Architect)

### 1. Komponenten-Architektur

```
page.tsx (Server Component)
├── Supabase-Query: alle Ideen laden (SSR)
└── <IdeaBoard ideas={ideas} />  (Client Component)
    ├── <FilterBar />
    │   ├── Kategorie-Chips: Alle | Feature | Bugfix | Verbesserung
    │   ├── Status-Chips: Alle | Offen | Geplant | In Arbeit | Erledigt
    │   └── Sortierung-Dropdown: Meiste Votes | Neueste | Älteste
    ├── <IdeaList ideas={filteredIdeas} />
    │   └── <IdeaCard /> (bestehend, aus PROJ-2/3)
    ├── <Pagination />
    └── <EmptyState /> (bei 0 Ergebnissen)
```

### 2. Neue Dateien

| Datei | Typ | Beschreibung |
|-------|-----|-------------|
| `src/components/idea-board.tsx` | Client Component | Haupt-Board mit State für Filter/Sort/Pagination |
| `src/components/filter-bar.tsx` | Client Component | Kategorie-Chips, Status-Chips, Sort-Dropdown |
| `src/components/pagination.tsx` | Client Component | Seitennavigation (20 pro Seite) |

### 3. Bestehende Dateien (Änderungen)

| Datei | Änderung |
|-------|---------|
| `src/app/page.tsx` | Query erweitern, IdeaBoard statt direkte IdeaCard-Liste |
| `src/components/idea-card.tsx` | Status-Badge hinzufügen (farbcodiert) |

### 4. DB-Migration (008)

Status-Werte in der `ideas`-Tabelle anpassen (Spec-Werte übernehmen):

```sql
-- Status-Enum-Werte aktualisieren
UPDATE ideas SET status = 'In Arbeit' WHERE status = 'In Bearbeitung';
ALTER TABLE ideas DROP CONSTRAINT IF EXISTS ideas_status_check;
ALTER TABLE ideas ADD CONSTRAINT ideas_status_check
  CHECK (status IN ('Offen', 'Geplant', 'In Arbeit', 'Erledigt'));
```

### 5. Filter & Sortierung (Client-seitig)

- **Warum Client-seitig?** MVP mit <100 Ideen, alle bereits per SSR geladen
- **Kategorie-Filter:** Chip-Buttons, `selectedCategory` State (null = Alle)
- **Status-Filter:** Chip-Buttons, `selectedStatus` State (null = Alle)
- **Sortierung:** Select/Dropdown mit 3 Optionen
  - "Meiste Votes" (default) → `sort by voteCount DESC`
  - "Neueste zuerst" → `sort by created_at DESC`
  - "Älteste zuerst" → `sort by created_at ASC`
- **Kombinierbar:** Kategorie + Status + Sortierung gleichzeitig aktiv

### 6. Pagination

- 20 Ideen pro Seite (nach Filterung)
- Einfache Seitennavigation: `< Zurück | Seite X von Y | Weiter >`
- Bei Filterwechsel → zurück auf Seite 1
- URL-Params nicht nötig (MVP, Client-State reicht)

### 7. Supabase Realtime

```typescript
// In idea-board.tsx
supabase.channel('ideas')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, handler)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, handler)
  .subscribe()
```

- **INSERT** auf `ideas` → Neue Karte hinzufügen
- **UPDATE** auf `ideas` → Status/Titel aktualisieren
- **DELETE** auf `ideas` → Karte entfernen
- **INSERT** auf `votes` → Vote-Count inkrementieren

### 8. Empty States

| Szenario | Nachricht |
|----------|-----------|
| Keine Ideen in DB | "Noch keine Ideen — sei der Erste!" + Link `/ideas/new` |
| Filter ohne Treffer | "Keine Ideen in dieser Kategorie/Status" + Button "Filter zurücksetzen" |

### 9. Status-Badge Farbcodes

| Status | Farbe | Tailwind |
|--------|-------|----------|
| Offen | Grau | `bg-gray-100 text-gray-700` |
| Geplant | Blau | `bg-blue-100 text-blue-700` |
| In Arbeit | Gelb | `bg-yellow-100 text-yellow-700` |
| Erledigt | Grün | `bg-green-100 text-green-700` |

### 10. Responsive Design

- **Desktop (≥768px):** Grid mit 2 Spalten, FilterBar horizontal
- **Mobile (<768px):** Single Column, FilterBar vertikal gestapelt, Chips horizontal scrollbar

### 11. Skeleton Loading

- Bestehende Card-Struktur als Skeleton (3 Platzhalter-Karten)
- FilterBar mit Skeleton-Chips
- Nur beim initialen Laden (SSR liefert sofort Daten, Skeleton für Client-Hydration)

### 12. Keine neuen Packages

Alles mit bestehenden Dependencies lösbar:
- `shadcn/ui` → Badge, Select, Button
- `lucide-react` → Icons
- `@supabase/supabase-js` → Realtime
- Tailwind CSS → Responsive, Farben

### 13. Tech-Entscheidungen

| Entscheidung | Gewählt | Begründung |
|-------------|---------|-----------|
| Filter-Logik | Client-seitig | <100 Ideen, SSR liefert alle, kein Extra-Roundtrip |
| Pagination | Klassisch (Seiten) | Einfacher als Infinite Scroll, bessere UX bei Filtern |
| Realtime-Scope | ideas + votes Tabellen | Deckt alle Live-Updates ab |
| Status-Migration | Spec-Werte übernehmen | Konsistenz mit Feature-Spec, User-Entscheidung |

---

## QA Test Results

**Tested:** 2026-02-11
**Tester:** QA Engineer Agent (Code-Level Review + Live Database Verification)
**App URL:** Supabase Project: `qwuxhupzlybtdaurtnbm`
**Method:** Full source code review of all PROJ-4 files + live Supabase database inspection via Management API + regression analysis of PROJ-1/2/3 files
**PROJ-4 Commit:** `06dcf0c` (PROJ-4 Idea Board: SSR conversion, status migration, board components)

---

### Regression Check (PROJ-1: User Authentication)

- [x] Login page (`/login`) untouched by PROJ-4 changes (confirmed via `git diff --name-status`)
- [x] Register page (`/register`) untouched
- [x] Forgot-password page (`/forgot-password`) untouched
- [x] Reset-password page (`/reset-password`) untouched
- [x] Auth layout (`(auth)/layout.tsx`) untouched
- [x] Middleware (`middleware.ts`) untouched -- route protection intact
- [x] AuthProvider (`auth-provider.tsx`) untouched
- [x] Header (`header.tsx`) untouched -- logout functionality intact

**Regression Result:** PROJ-1 is NOT affected by PROJ-4 changes. Zero auth files modified.

---

### Regression Check (PROJ-2: Idea Submission)

- [x] Idea form (`idea-form.tsx`) untouched -- create/edit functionality intact
- [x] New idea page (`/ideas/new/page.tsx`) untouched
- [x] Edit idea page (`/ideas/[id]/edit/page.tsx`) untouched
- [x] Detail page (`/ideas/[id]/page.tsx`) modified -- `statusColor` function added (color-coded badges), VoteButton preserved, edit/delete functionality preserved
- [x] IdeaCard (`idea-card.tsx`) modified -- `statusColor` function added, Status Badge added, layout now includes status+category badges in header. VoteButton integration preserved.
- [x] Home page (`page.tsx`) converted from CSR to SSR -- query is now server-side with `createClient()` from `@/lib/supabase-server`. Query fields identical: `id, title, description, status, created_at, category:categories(name), author:profiles(email), votes(count)`
- [x] Error handling on home page preserved (error state shows `AlertCircle` with "Fehler" message)

**Regression Result:** PROJ-2 core functionality (create, edit, delete ideas) is NOT affected. IdeaCard and detail page enhanced with status badges (backwards-compatible). Home page SSR conversion is a structural change but preserves all data fields.

---

### Regression Check (PROJ-3: Voting System)

- [x] VoteButton (`vote-button.tsx`) untouched -- optimistic update, debounce, error handling all preserved
- [x] Votes migration (`007_create_votes.sql`) untouched
- [x] VoteButton rendered in IdeaCard (`idea-card.tsx:53`) -- props unchanged (`ideaId`, `initialVoteCount`)
- [x] VoteButton rendered in detail page (`ideas/[id]/page.tsx:149-153`) -- props unchanged, `size="lg"` preserved
- [x] Vote count passed correctly: `idea.votes?.[0]?.count ?? 0` pattern used consistently

**Regression Result:** PROJ-3 Voting System is NOT affected by PROJ-4 changes. VoteButton component completely untouched. Note: PROJ-3 BUG-6 (VoteButton state sync) is now more relevant due to Realtime -- see detailed analysis below.

---

### Acceptance Criteria Status

#### AC-1: Board zeigt alle Ideen als Karten (Titel, Beschreibung-Preview, Vote-Count, Status, Kategorie)

- [x] Home page (`page.tsx`) queries all ideas via SSR: `supabase.from('ideas').select('id, title, description, status, created_at, category:categories(name), author:profiles(email), votes(count)')`
- [x] Ideas passed to `<IdeaBoard initialIdeas={...} />` client component
- [x] IdeaBoard renders `<IdeaCard>` for each idea -- `idea-board.tsx:236-248`
- [x] **Title:** `<CardTitle className="text-base leading-snug">{title}</CardTitle>` -- `idea-card.tsx:58`
- [x] **Description Preview:** `<p className="line-clamp-2 text-sm text-gray-600">{description}</p>` -- `idea-card.tsx:70` (truncated to 2 lines via `line-clamp-2`)
- [x] **Vote Count:** `<VoteButton ideaId={id} initialVoteCount={voteCount} />` -- `idea-card.tsx:53`
- [x] **Status:** `<Badge className={statusColor(status)}>{status}</Badge>` -- `idea-card.tsx:60`
- [x] **Category:** `{category && <Badge variant="outline">{category}</Badge>}` -- `idea-card.tsx:62-64`
- [x] **Author + Date:** `{authorEmail} . {date}` shown below description -- `idea-card.tsx:71-73`

**Status: PASS**

#### AC-2: Filter nach Kategorie (Dropdown oder Chips)

- [x] FilterBar renders category chips: `['Alle', 'Feature', 'Bugfix', 'Verbesserung']` -- `filter-bar.tsx:12`
- [x] Chip-style buttons with active/outline variants -- `filter-bar.tsx:53-62`
- [x] "Alle" maps to `null` (no filter), specific category maps to exact string match -- `filter-bar.tsx:58`
- [x] Client-side filtering: `result.filter((idea) => idea.category?.name === selectedCategory)` -- `idea-board.tsx:55-57`
- [x] Filter change resets pagination to page 1 -- `idea-board.tsx:36-38`
- [ ] **BUG-1 (Low):** Category chips are hardcoded to `['Alle', 'Feature', 'Bugfix', 'Verbesserung']`. If an admin adds a new category via PROJ-5, the filter bar will not show it. The categories should be derived from the actual `categories` table or from the ideas data.

**Status: PASS (with minor issue)**

#### AC-3: Filter nach Status (Offen, Geplant, In Arbeit, Erledigt)

- [x] FilterBar renders status chips: `['Alle', 'Offen', 'Geplant', 'In Arbeit', 'Erledigt']` -- `filter-bar.tsx:13`
- [x] Chip-style buttons matching category chips pattern -- `filter-bar.tsx:72-89`
- [x] Client-side filtering: `result.filter((idea) => idea.status === selectedStatus)` -- `idea-board.tsx:59-61`
- [x] Status values match database CHECK constraint: `('Offen', 'Geplant', 'In Arbeit', 'Erledigt')` -- verified in live DB
- [x] Filter change resets pagination to page 1 -- `idea-board.tsx:40-42`

**Status: PASS**

#### AC-4: Sortierung: "Meiste Votes" (default), "Neueste zuerst", "Alteste zuerst"

- [x] Sort dropdown with 3 options: `votes` (Meiste Votes), `newest` (Neueste zuerst), `oldest` (Alteste zuerst) -- `filter-bar.tsx:15-19`
- [x] Default sort: `useState<SortOption>('votes')` -- `idea-board.tsx:32`
- [x] "Meiste Votes": `(b.votes?.[0]?.count ?? 0) - (a.votes?.[0]?.count ?? 0)` (DESC) -- `idea-board.tsx:65-66`
- [x] "Neueste zuerst": `new Date(b.created_at) - new Date(a.created_at)` (DESC) -- `idea-board.tsx:68-70`
- [x] "Alteste zuerst": `new Date(a.created_at) - new Date(b.created_at)` (ASC) -- `idea-board.tsx:72-74`
- [x] Filters and sort are combinable simultaneously -- `useMemo` applies category filter, then status filter, then sort
- [x] Sort change resets pagination to page 1 -- `idea-board.tsx:44-47`
- [x] Select component from shadcn/ui for dropdown -- `filter-bar.tsx:98-112`

**Status: PASS**

#### AC-5: Ideen-Detail-Ansicht bei Klick (vollstandige Beschreibung, Autor, Datum, Votes)

- [x] IdeaCard wraps content area in `<Link href={'/ideas/${id}'}}>` -- `idea-card.tsx:55`
- [x] Detail page at `/ideas/[id]/page.tsx` fetches single idea with full data
- [x] **Full description:** `<p className="whitespace-pre-wrap text-gray-700">{idea.description}</p>` -- `ideas/[id]/page.tsx:207-209`
- [x] **Author:** `{idea.author?.email ?? 'Unbekannt'}` -- `ideas/[id]/page.tsx:214-216`
- [x] **Date:** `toLocaleDateString('de-DE', {...})` with day, month, year, hour, minute -- `ideas/[id]/page.tsx:114-120`
- [x] **Votes:** VoteButton with `size="lg"` -- `ideas/[id]/page.tsx:149-153`
- [x] **Status Badge:** Color-coded badge using same `statusColor()` function -- `ideas/[id]/page.tsx:157`
- [x] **Category Badge:** Shown if present -- `ideas/[id]/page.tsx:158-160`
- [x] **Back link:** "Zuruck zum Board" with ArrowLeft icon -- `ideas/[id]/page.tsx:137-143`
- [x] **Edit/Delete:** Author-only actions preserved from PROJ-2 -- `ideas/[id]/page.tsx:164-201`
- [x] **Edited indicator:** Shows "Zuletzt bearbeitet am" if updated_at !== created_at -- `ideas/[id]/page.tsx:122-131`

**Status: PASS**

#### AC-6: Responsive Design (Mobile + Desktop)

- [x] Board uses `space-y-3` for card list (single column, stacked) -- `idea-board.tsx:235`
- [x] FilterBar uses `flex-wrap` for chips to wrap on narrow screens -- `filter-bar.tsx:42, 67`
- [x] IdeaCard uses flex layout that adapts to width -- `idea-card.tsx:51`
- [x] Main container: `mx-auto max-w-5xl px-4 py-8` provides responsive padding -- `page.tsx:21`
- [x] Header: `mx-auto max-w-5xl px-4` consistent max-width -- `header.tsx:25`
- [ ] **BUG-2 (Low):** Tech design specifies "Desktop: Grid mit 2 Spalten" but implementation uses single-column `space-y-3` layout for all screen sizes. No `grid grid-cols-2` or `md:grid-cols-2` is used. The cards are always displayed in a single column list. This deviates from the tech design but may be an intentional simplification for MVP.
- [ ] **BUG-3 (Low):** Tech design specifies "Mobile: Chips horizontal scrollbar" but the chips use `flex-wrap` which wraps to multiple lines instead of horizontal scrolling with `overflow-x-auto`. On very narrow screens, the status chips (5 items including "In Arbeit") may stack awkwardly.

**Status: PASS (functional, with layout deviations from tech design)**

#### AC-7: Leerer Zustand: "Noch keine Ideen -- sei der Erste!" mit Link zum Einreichen

- [x] Empty state when `ideas.length === 0`: "Noch keine Ideen -- sei der Erste!" -- `idea-board.tsx:185-186`
- [x] Lightbulb icon for visual appeal -- `idea-board.tsx:184`
- [x] CTA text: "Reiche die erste Idee ein und starte die Diskussion." -- `idea-board.tsx:188-190`
- [x] Button links to `/ideas/new`: "Erste Idee einreichen" -- `idea-board.tsx:191-196`
- [x] Styled with dashed border, centered layout -- `idea-board.tsx:183`
- [x] Database currently has 0 ideas, so this empty state is what users will see initially -- verified via live DB query

**Status: PASS**

#### AC-8: Pagination bei >20 Ideen

- [x] `PAGE_SIZE = 20` constant defined -- `idea-board.tsx:22`
- [x] Pagination calculated from filtered results: `Math.ceil(filteredAndSorted.length / PAGE_SIZE)` -- `idea-board.tsx:82-84`
- [x] Items sliced for current page: `.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)` -- `idea-board.tsx:86-89`
- [x] "Zuruck" button disabled on page 1 -- `idea-board.tsx:256`
- [x] "Weiter" button disabled on last page -- `idea-board.tsx:267`
- [x] Page indicator: "Seite {currentPage} von {totalPages}" -- `idea-board.tsx:261-263`
- [x] Pagination UI hidden when only 1 page: `{totalPages > 1 && ...}` -- `idea-board.tsx:251`
- [x] Filter changes reset to page 1 -- `idea-board.tsx:36-47` (all three handlers call `setCurrentPage(1)`)
- [ ] **Note:** No separate `pagination.tsx` component was created (mentioned in tech design). Pagination is inline in `idea-board.tsx`. This is simpler and acceptable for MVP.

**Status: PASS**

---

### Edge Cases Status

#### EC-1: Keine Ideen vorhanden -> Empty State mit Call-to-Action

- [x] `ideas.length === 0` check before any filtering -- `idea-board.tsx:179`
- [x] Displays "Noch keine Ideen -- sei der Erste!" message
- [x] CTA button "Erste Idee einreichen" links to `/ideas/new`
- [x] Filter bar still rendered above empty state (allows user to see filters exist)
- [x] Currently active in production (0 ideas in DB)

**Status: PASS**

#### EC-2: Alle Ideen gefiltert -> "Keine Ideen in dieser Kategorie/Status"

- [x] `filteredAndSorted.length === 0` check (only when `ideas.length > 0`) -- `idea-board.tsx:203`
- [x] Displays: "Keine Ideen gefunden" with subtitle "Keine Ideen in dieser Kategorie/Status." -- `idea-board.tsx:209-213`
- [x] SearchX icon for visual differentiation from empty-DB state -- `idea-board.tsx:208`
- [x] "Filter zurucksetzen" button resets both category and status filters and page -- `idea-board.tsx:216-224`
- [x] Filter bar visible above empty state (user can adjust filters)

**Status: PASS**

#### EC-3: Idee wird geloscht wahrend Board offen -> Karte entfernen (Realtime)

- [x] Realtime subscription on `ideas` table DELETE event -- `idea-board.tsx:135-142`
- [x] Handler filters out deleted idea: `prev.filter((idea) => idea.id !== payload.old.id)` -- `idea-board.tsx:139-141`
- [x] INSERT handler: fetches full idea data and prepends to list -- `idea-board.tsx:97-111`
- [x] UPDATE handler: fetches updated data and replaces in list -- `idea-board.tsx:113-133`
- [x] Votes INSERT handler: increments vote count locally -- `idea-board.tsx:144-158`
- [x] Channel properly cleaned up on unmount: `supabase.removeChannel(channel)` -- `idea-board.tsx:162-164`
- [ ] **BUG-4 (Medium): Supabase Realtime is NOT enabled for `ideas` and `votes` tables.** The `supabase_realtime` publication has NO tables. Verified via live DB query: `SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime'` returns empty result `[]`. The code subscribes to realtime channels but will never receive any events. **This means EC-3 (live deletion), live new ideas, and live vote updates all silently fail.** The migration `008_align_status_values_proj4.sql` does not include `ALTER PUBLICATION supabase_realtime ADD TABLE ideas, votes;`.

**Status: PASS -- Realtime enabled via `ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas, public.votes;` (BUG-4 GEFIXT)**

#### EC-4: Sehr langer Titel/Beschreibung -> Text truncaten mit "..."

- [x] Description truncated with `line-clamp-2` CSS class -- `idea-card.tsx:70`
- [x] `line-clamp-2` truncates to 2 lines with `...` ellipsis (Tailwind utility)
- [x] Title has no explicit truncation, but DB limit is 100 chars which fits in one line
- [ ] **Note:** No tooltip on hover for truncated text as mentioned in spec ("Tooltip/Detail-Ansicht"). Detail view serves as the full-text fallback. Acceptable for MVP.

**Status: PASS**

#### EC-5: Langsame Verbindung -> Skeleton-Loading anzeigen

- [x] Detail page shows skeleton during loading: `<Skeleton className="h-6 w-24 mb-6" />` and `<Skeleton className="h-[300px] w-full" />` -- `ideas/[id]/page.tsx:104-109`
- [x] Home page uses SSR, so initial HTML is rendered server-side with actual data (no client-side loading state needed)
- [ ] **BUG-5 (Low):** No skeleton loading for the board itself during client hydration. The tech design specifies "Skeleton-Loading: 3 Platzhalter-Karten" and "FilterBar mit Skeleton-Chips" for the initial load. Since SSR delivers real data, this is only relevant during hydration delay on slow connections. The IdeaBoard renders immediately with `initialIdeas` from SSR props, so in practice users see real content instantly. Low impact.
- [ ] **Note:** The tech design mentioned a separate `pagination.tsx` component with skeleton -- not implemented, pagination is inline. No skeleton for filter bar.

**Status: PASS (SSR mitigates the slow-connection scenario)**

---

### Security Review

#### RLS Policies -- VERIFIED IN LIVE DATABASE

- [x] `ideas` table: RLS ENABLED (`relrowsecurity: true`)
- [x] `votes` table: RLS ENABLED (`relrowsecurity: true`)
- [x] `categories` table: RLS ENABLED (`relrowsecurity: true`)
- [x] Ideas SELECT: `(SELECT auth.uid()) IS NOT NULL` -- all authenticated users can read
- [x] Ideas INSERT: `(SELECT auth.uid()) = author_id` -- can only create as yourself
- [x] Ideas UPDATE: `(SELECT auth.uid()) = author_id` (USING + WITH CHECK)
- [x] Ideas DELETE: `(SELECT auth.uid()) = author_id`
- [x] Votes SELECT: `(SELECT auth.uid()) IS NOT NULL`
- [x] Votes INSERT: `(SELECT auth.uid()) = user_id`
- [x] All policies use `(SELECT auth.uid())` pattern (initplan optimization)

#### Immutable Columns Trigger

- [x] `ideas_protect_immutable_columns` trigger is ENABLED (`tgenabled: O`) -- verified in live DB
- [x] Protects `status`, `author_id`, `created_at` from modification
- [x] Migration 008 correctly disabled trigger before status migration, then re-enabled it
- [x] `ideas_updated_at` trigger also enabled for automatic `updated_at` management

#### SSR Security

- [x] Home page uses server-side Supabase client (`@/lib/supabase-server`) which runs with the user's session cookies -- no service_role key exposed
- [x] Query results are passed as props to client component -- no server secrets leaked
- [x] Client-side Supabase client (`@/lib/supabase`) used for Realtime subscription -- uses anon key (public, expected)

#### XSS Protection

- [x] All user-generated content (title, description, author email) rendered as text content via React JSX -- auto-escaped
- [x] No `dangerouslySetInnerHTML` used anywhere in PROJ-4 files
- [x] Filter values are hardcoded strings (not user input)
- [x] Sort values constrained to type `SortOption` = `'votes' | 'newest' | 'oldest'`

#### Input Validation

- [x] No user input accepted by PROJ-4 components (read-only board + filters)
- [x] Filter/sort state is controlled via predefined values, not free text
- [x] Idea creation/editing handled by unchanged PROJ-2 components

#### Data Exposure

- [x] Board only shows ideas that the user is authorized to see (RLS enforces auth)
- [x] No admin-only data exposed in board queries
- [x] Author email is shown (by design per spec) -- not a security issue since all users are invited/authenticated

#### Migration Security (008)

- [x] Migration correctly handles the immutable columns trigger (disable, migrate, re-enable)
- [x] `'Abgelehnt'` status values migrated to `'Offen'` (data preservation)
- [x] `'In Bearbeitung'` migrated to `'In Arbeit'` (terminology alignment)
- [x] New CHECK constraint restricts to exactly 4 allowed values
- [ ] **Note:** The migration maps `'Abgelehnt'` to `'Offen'` which changes the semantic meaning. Previously rejected ideas become open again. This is a deliberate decision per the spec but worth noting for data integrity awareness.

---

### Database Verification Summary

| Check | Expected | Actual | Status |
|---|---|---|---|
| Status CHECK constraint | `('Offen', 'Geplant', 'In Arbeit', 'Erledigt')` | `CHECK ((status = ANY (ARRAY['Offen'::text, 'Geplant'::text, 'In Arbeit'::text, 'Erledigt'::text])))` | PASS |
| Status default value | `'Offen'` | `'Offen'::text` | PASS |
| `ideas_protect_immutable_columns` trigger | ENABLED | `tgenabled: O` (Origin = enabled) | PASS |
| `ideas_updated_at` trigger | ENABLED | `tgenabled: O` | PASS |
| RLS on `ideas` | ENABLED | `relrowsecurity: true` | PASS |
| RLS on `votes` | ENABLED | `relrowsecurity: true` | PASS |
| RLS on `categories` | ENABLED | `relrowsecurity: true` | PASS |
| 4 RLS policies on `ideas` | SELECT, INSERT, UPDATE, DELETE | All 4 present with `(SELECT auth.uid())` pattern | PASS |
| 2 RLS policies on `votes` | SELECT, INSERT | Both present with `(SELECT auth.uid())` pattern | PASS |
| Supabase Realtime publication | `ideas` and `votes` in publication | Both tables in `supabase_realtime` publication | **PASS (GEFIXT)** |
| Categories in DB | 3 default categories | "Bugfix", "Feature", "Verbesserung" | PASS |
| Ideas count | N/A | 0 (empty, expected for fresh deploy) | PASS |
| No old status values remain | No `'In Bearbeitung'` or `'Abgelehnt'` | 0 ideas, no violations possible | PASS |

---

### Bugs Found

#### BUG-1 (Low): Category filter chips are hardcoded

- **Severity:** Low
- **Category:** Maintainability / Extensibility
- **Location:** `src/components/filter-bar.tsx:12`
- **Description:** The category chips are hardcoded as `['Alle', 'Feature', 'Bugfix', 'Verbesserung']`. If an admin adds a new category via PROJ-5, the filter bar will not display the new category option. Users will not be able to filter by newly created categories.
- **Current Impact:** Low -- only 3 categories exist, and PROJ-5 (admin category management) is not yet implemented.
- **Fix:** Derive categories from the `initialIdeas` data (extract unique category names) or load from `categories` table.
- **Priority:** Low (address when PROJ-5 is implemented)

#### BUG-2 (Low): Board layout deviates from tech design (no 2-column grid)

- **Severity:** Low
- **Category:** UI / Spec Deviation
- **Location:** `src/components/idea-board.tsx:235`
- **Description:** Tech design specifies "Desktop (>=768px): Grid mit 2 Spalten" but implementation uses `space-y-3` (single column list) for all screen sizes. Cards are always stacked vertically.
- **Current Impact:** Low -- single column is functional and arguably better for readability with the current card design (vote button on left + content on right).
- **Fix:** Add `className="mt-6 grid gap-3 md:grid-cols-2"` if 2-column layout is desired.
- **Priority:** Low (design preference, not functional issue)

#### BUG-3 (Low): Filter chips wrap instead of horizontal scroll on mobile

- **Severity:** Low
- **Category:** UI / Spec Deviation
- **Location:** `src/components/filter-bar.tsx:42, 67`
- **Description:** Tech design specifies "Mobile: Chips horizontal scrollbar" but chips use `flex-wrap` which wraps to multiple lines. On narrow screens, the 5 status chips may occupy significant vertical space.
- **Fix:** Replace `flex-wrap` with `overflow-x-auto flex-nowrap` and add scrollbar styling for mobile.
- **Priority:** Low (cosmetic, does not break functionality)

#### ~~BUG-4 (Medium): Supabase Realtime not enabled for ideas and votes tables~~ **GEFIXT**

- **Severity:** Medium
- **Category:** Feature Incomplete / Backend Configuration
- **Location:** Migration `008_align_status_values_proj4.sql` (added Realtime publication lines)
- **Description:** The `supabase_realtime` publication has NO tables registered. The Realtime subscription code in `idea-board.tsx:92-165` will never receive any events. This means:
  - New ideas added by other users will NOT appear live
  - Ideas deleted by other users will NOT disappear live
  - Ideas updated (status change) by admins will NOT reflect live
  - Votes from other users will NOT increment live
  All these features require `ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas, public.votes;` to be executed.
- **Steps to Reproduce:**
  1. Open the board in two browser tabs (or two different users)
  2. In tab 1, create a new idea
  3. In tab 2, observe that the new idea does NOT appear
  4. Expected: New idea card appears automatically
  5. Actual: Board remains static until page refresh
- **Fix:** Add to migration or execute manually:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
  ```
- **Priority:** Medium (core feature of PROJ-4 spec: "Supabase Realtime Subscription fur Live-Updates")

#### BUG-5 (Low): No skeleton loading for board during hydration

- **Severity:** Low
- **Category:** UX / Spec Deviation
- **Location:** `src/components/idea-board.tsx`
- **Description:** Tech design specifies "Skeleton-Loading: 3 Platzhalter-Karten" and "FilterBar mit Skeleton-Chips" but no skeleton is implemented for the board. SSR mitigates this since real data is served in the initial HTML, but during client hydration on slow connections there may be a brief flash before interactivity.
- **Current Impact:** Minimal -- SSR delivers real content immediately. Skeleton would only be visible during hydration.
- **Priority:** Low (nice-to-have)

#### BUG-6 (Low): VoteButton state does not sync with Realtime updates (inherited from PROJ-3)

- **Severity:** Low (upgraded from Info in PROJ-3 QA)
- **Category:** State Management / UX
- **Location:** `src/components/vote-button.tsx:22`
- **Description:** `useState(initialVoteCount)` is only set on initial render. When the IdeaBoard receives a Realtime vote update and re-renders IdeaCard with a new `voteCount`, the VoteButton's internal state does not sync. This means other users' votes are not reflected in the VoteButton counter (even when Realtime is eventually enabled).
- **Scenario:** User A sees idea with 5 votes. User B votes (count becomes 6). Realtime updates IdeaBoard state. IdeaCard re-renders with `voteCount=6`. But VoteButton still shows 5 because `useState(5)` was set on mount.
- **Mitigating Factor:** Board-level sorting uses IdeaBoard state (correct), so sort order is accurate. Only the displayed count on individual cards is stale.
- **Fix:** Add `useEffect(() => setVoteCount(initialVoteCount), [initialVoteCount])` in VoteButton, or lift vote count state to IdeaBoard.
- **Priority:** Low (only visible with multiple concurrent users, and Realtime is not yet enabled anyway per BUG-4)

#### BUG-7 (Info): Pagination.tsx component not created as specified in tech design

- **Severity:** Info
- **Category:** Implementation Deviation
- **Location:** `src/components/idea-board.tsx:251-273`
- **Description:** Tech design lists `src/components/pagination.tsx` as a new file to create, but pagination is implemented inline in `idea-board.tsx`. This is simpler and avoids an extra component for a small UI element.
- **Impact:** None -- functionality is correct and complete.
- **Priority:** None (acceptable simplification)

---

### Summary

| Category | Count |
|---|---|
| Acceptance Criteria Tested | 8 |
| Acceptance Criteria PASSED | 8 (all core functionality works) |
| Edge Cases Tested | 5 |
| Edge Cases PASSED | 5 |
| Edge Cases FAILED | 0 |
| Bugs Found | 7 (0 Critical, 0 High, 0 Medium, 5 Low, 2 Info) -- BUG-4 GEFIXT |
| PROJ-1 Regression | PASSED -- no files modified |
| PROJ-2 Regression | PASSED -- enhanced IdeaCard, SSR conversion, core unchanged |
| PROJ-3 Regression | PASSED -- VoteButton untouched, BUG-6 severity upgraded |

---

### PROJ-1 Regression Status

**PASSED** -- No regression detected. All PROJ-1 auth files (login, register, forgot-password, reset-password, middleware, auth-provider, header) are untouched by PROJ-4 implementation.

### PROJ-2 Regression Status

**PASSED** -- Core functionality intact. IdeaCard enhanced with status badges (non-breaking). Home page converted from CSR to SSR (structural change, data unchanged). Idea form, edit page, delete functionality all untouched.

### PROJ-3 Regression Status

**PASSED** -- VoteButton component completely untouched. All voting functionality preserved. BUG-6 (state sync) upgraded from Info to Low due to Realtime implementation.

---

### Production-Ready Decision

**READY** -- All 8 Acceptance Criteria pass. All 5 Edge Cases pass. BUG-4 (Realtime) fixed. No Critical, High, or Medium bugs remaining. Only Low-severity UX deviations from tech design and Info-level items. All regressions for PROJ-1, PROJ-2, PROJ-3 passed.

### Recommended Fix Priority

1. ~~**BUG-4 (Medium):** Enable Supabase Realtime for `ideas` and `votes` tables~~ **GEFIXT**
2. **BUG-6 (Low):** Add VoteButton state sync with prop changes -- small code change
3. **BUG-1 (Low):** Make category chips dynamic -- address with PROJ-5
4. **BUG-2 (Low):** Consider 2-column grid layout for desktop -- design decision
5. **BUG-3 (Low):** Horizontal scroll for mobile filter chips -- CSS change
6. **BUG-5 (Low):** Add skeleton loading for hydration -- nice-to-have
7. **BUG-7 (Info):** Extract pagination component -- optional refactor

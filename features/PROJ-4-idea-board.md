# PROJ-4: Idea Board

## Status: 🟡 In Development

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

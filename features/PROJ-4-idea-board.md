# PROJ-4: Idea Board

## Status: 🔵 Planned

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

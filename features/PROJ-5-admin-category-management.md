# PROJ-5: Admin - Kategorie-Verwaltung

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Admin-Rolle prüfen

## Beschreibung
Admins können Kategorien erstellen, bearbeiten und löschen. Kategorien werden genutzt, um Ideen thematisch zu gruppieren. Es gibt keine vorgegebenen Kategorien — der Admin erstellt sie frei nach Bedarf.

## User Stories
- Als Admin möchte ich neue Kategorien erstellen, um Ideen thematisch zu organisieren
- Als Admin möchte ich Kategorien umbenennen, um sie an veränderte Bedürfnisse anzupassen
- Als Admin möchte ich Kategorien löschen, die nicht mehr benötigt werden
- Als Admin möchte ich sehen, wie viele Ideen jeder Kategorie zugeordnet sind

## Acceptance Criteria
- [ ] Admin-Bereich mit Kategorie-Verwaltung (nur für Admin-Rolle sichtbar)
- [ ] Kategorie erstellen: Name (Pflicht, max. 50 Zeichen, eindeutig)
- [ ] Kategorie umbenennen: Inline-Edit oder Modal
- [ ] Kategorie löschen: Mit Bestätigungsdialog
- [ ] Anzeige der Ideen-Anzahl pro Kategorie
- [ ] Kategorien werden im Idea Submission Dropdown angezeigt (PROJ-2)
- [ ] Kategorien werden als Filter-Optionen im Board angezeigt (PROJ-4)

## Edge Cases
- Kategorie löschen die noch Ideen enthält → Ideen werden auf "Ohne Kategorie" gesetzt
- Doppelter Kategorie-Name → Fehlermeldung "Kategorie existiert bereits"
- Leerer Kategorie-Name → Validierungsfehler
- Kategorie umbenennen → Alle zugeordneten Ideen zeigen neuen Namen
- Nicht-Admin versucht Zugriff auf Admin-Bereich → Redirect zum Board

## Technische Anforderungen
- Supabase Tabelle `categories` (id, name, created_at)
- RLS: Nur Admins können Kategorien erstellen/bearbeiten/löschen
- Admin-Rolle über `profiles.role` Feld (admin/user)

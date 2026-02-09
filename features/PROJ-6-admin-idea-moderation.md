# PROJ-6: Admin - Ideen-Moderation & Status

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Admin-Rolle prüfen
- Benötigt: PROJ-2 (Idea Submission) - Ideen zum Moderieren

## Beschreibung
Admins können den Status von Ideen verwalten (Offen → Geplant → In Arbeit → Erledigt) und unangemessene Ideen löschen. Statusänderungen sind für alle Nutzer im Board sichtbar.

## User Stories
- Als Admin möchte ich den Status einer Idee ändern, um den Fortschritt zu kommunizieren
- Als Admin möchte ich unangemessene Ideen löschen, um die Qualität des Boards zu sichern
- Als Nutzer möchte ich Statusänderungen sehen, um zu wissen ob meine Idee bearbeitet wird

## Acceptance Criteria
- [ ] Admin kann Status setzen: Offen → Geplant → In Arbeit → Erledigt
- [ ] Statusänderung über Dropdown in der Ideen-Detail-Ansicht (nur für Admins)
- [ ] Status wird als farbiges Badge auf der Ideen-Karte angezeigt
  - Offen: Grau
  - Geplant: Blau
  - In Arbeit: Orange
  - Erledigt: Grün
- [ ] Admin kann jede Idee löschen (mit Bestätigungsdialog)
- [ ] Statusänderungen sind sofort für alle Nutzer sichtbar (Realtime)
- [ ] Status kann vorwärts und rückwärts geändert werden (flexibel, kein strikter Flow)

## Edge Cases
- Admin löscht Idee mit vielen Votes → Bestätigungsdialog mit Vote-Anzahl
- Mehrere Admins ändern Status gleichzeitig → Letzte Änderung gewinnt
- Idee auf "Erledigt" setzen → Bleibt sichtbar im Board, kann gefiltert werden

## Technische Anforderungen
- `ideas.status` Feld (enum: open, planned, in_progress, done)
- RLS: Nur Admins können Status ändern und fremde Ideen löschen
- Supabase Realtime für sofortige Status-Updates

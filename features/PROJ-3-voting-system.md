# PROJ-3: Voting System

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (User Authentication) - Nur eingeloggte Nutzer können voten
- Benötigt: PROJ-2 (Idea Submission) - Es müssen Ideen existieren zum Voten

## Beschreibung
Eingeloggte Nutzer können für Ideen abstimmen (Upvote). Votes sind unbegrenzt — ein Nutzer kann eine Idee mehrfach upvoten. Die Gesamtzahl der Votes wird pro Idee angezeigt.

## User Stories
- Als eingeloggter Nutzer möchte ich eine Idee upvoten, um meine Unterstützung auszudrücken
- Als eingeloggter Nutzer möchte ich eine Idee mehrfach upvoten können, um stärkere Präferenz zu zeigen
- Als Nutzer möchte ich die Gesamtzahl der Votes pro Idee sehen, um die Beliebtheit einzuschätzen

## Acceptance Criteria
- [ ] Upvote-Button an jeder Idee sichtbar (für eingeloggte Nutzer)
- [ ] Jeder Klick auf Upvote erhöht den Vote-Counter um 1
- [ ] Vote-Zähler wird in Echtzeit aktualisiert
- [ ] Nicht-eingeloggte Nutzer sehen Vote-Zähler, können aber nicht voten
- [ ] Vote wird mit User-ID, Idea-ID und Timestamp gespeichert
- [ ] Optimistisches UI-Update (Counter erhöht sich sofort, Server-Sync im Hintergrund)

## Edge Cases
- Schnelles Mehrfachklicken → Jeder Klick zählt, Debounce von 300ms
- Netzwerkfehler beim Voten → Optimistisches Update rückgängig machen, Fehlermeldung anzeigen
- Voten auf gelöschte Idee → Fehlermeldung "Idee existiert nicht mehr"
- Voten während man ausgeloggt wird → Redirect zum Login

## Technische Anforderungen
- Supabase Tabelle `votes` (user_id, idea_id, created_at)
- RLS: Jeder eingeloggte Nutzer kann Votes erstellen
- Vote-Count als aggregierter Wert (COUNT auf votes Tabelle)

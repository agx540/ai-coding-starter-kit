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

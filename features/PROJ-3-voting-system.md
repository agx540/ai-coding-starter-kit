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

## Tech-Design (Solution Architect)

### Bestehende Architektur (Wiederverwendung aus PROJ-1 + PROJ-2)
- Auth-System (Login, Register, Session-Management)
- AuthProvider (User-State im Frontend)
- Header mit Logout
- Middleware für geschützte Routen
- Supabase-Client (Browser + Server)
- `ideas` Tabelle mit RLS
- `IdeaCard` Komponente (Ideen-Karten auf dem Board)
- Idee-Detail-Seite (`/ideas/[id]`)
- shadcn/ui Komponenten (Button, Card, Badge, etc.)
- `sonner` für Toast-Benachrichtigungen

### Component-Struktur

```
App (bestehend)
├── Header (bestehend, unverändert)
│
├── Ideen-Board-Seite (/) — bestehend, erweitert
│   └── Ideen-Karten (bestehend, erweitert)
│       ├── Titel, Beschreibung, Badges (bestehend)
│       └── NEU: Vote-Bereich
│           ├── Upvote-Button (Pfeil-nach-oben Icon)
│           └── Vote-Zähler (Gesamtzahl)
│
└── Idee-Detail-Seite (/ideas/[id]) — bestehend, erweitert
    ├── Titel, Beschreibung, Badges (bestehend)
    ├── Autor-Info + Datum (bestehend)
    └── NEU: Vote-Bereich (größer dargestellt)
        ├── Upvote-Button (Pfeil-nach-oben Icon)
        └── Vote-Zähler (Gesamtzahl)
```

### Daten-Model

```
Jeder Vote hat:
- Eindeutige ID
- Verweis auf die Idee (welche Idee wurde gevotet)
- Verweis auf den Nutzer (wer hat gevotet)
- Zeitpunkt des Votes

Gespeichert in: Supabase (PostgreSQL mit Row Level Security)

Beziehung:
- Ein Nutzer kann eine Idee MEHRFACH voten (unbegrenzt)
- Ein Vote gehört immer zu genau einer Idee und einem Nutzer
- Wenn eine Idee gelöscht wird → alle Votes werden automatisch mitgelöscht
```

### Sicherheitskonzept (Datenbank-Regeln)

```
Votes lesen:     Alle eingeloggten Nutzer dürfen Vote-Zähler sehen
Vote erstellen:  Nur eingeloggte Nutzer (Vote wird mit eigener User-ID gespeichert)
Votes bearbeiten: Niemand (Votes sind unveränderlich)
Votes löschen:   Niemand (kein Undo/Unvote laut Spec)

→ RLS: Nur INSERT + SELECT, kein UPDATE oder DELETE für reguläre Nutzer
```

### Seitenfluss (User Journey)

```
Eingeloggter Nutzer auf Ideen-Board
        ↓
Sieht Vote-Zähler an jeder Ideen-Karte
        ↓
Klickt Upvote-Button
        ↓
Zähler erhöht sich SOFORT um 1 (optimistisches Update)
        ↓
Vote wird im Hintergrund an Supabase gesendet
        ↓
Erfolg → Vote gespeichert, Zähler bleibt
Fehler → Zähler wird zurückgesetzt, Fehlermeldung wird angezeigt

Schnelles Mehrfachklicken:
    Klick → 300ms Pause (Debounce) → nächster Klick wird akzeptiert
    Jeder akzeptierte Klick = 1 Vote

Nicht eingeloggter Nutzer:
    Sieht Vote-Zähler (nur lesend)
    Upvote-Button ist NICHT sichtbar (Middleware leitet zum Login um)
```

### Tech-Entscheidungen

```
Warum Vote-Count als Live-Aggregation statt gespeicherter Zähler?
→ Immer korrekt (keine Inkonsistenz zwischen Zähler und tatsächlichen Votes)
→ Bei wenigen hundert Ideen performant genug
→ Einfacher zu implementieren (kein zweites Update auf ideas-Tabelle nötig)

Warum 300ms Debounce?
→ Feature Spec verlangt es explizit
→ Verhindert versehentliche Doppel-Votes
→ Bewusste Mehrfach-Votes sind weiterhin möglich (Pause > 300ms)

Warum optimistisches UI-Update?
→ Feature Spec verlangt es
→ Fühlt sich sofort an (kein Warten auf Server-Antwort)
→ Bei Fehler wird automatisch zurückgerollt

Warum kein Unvote/Downvote?
→ Feature Spec sagt: "Votes sind unbegrenzt, Mehrfach-Upvote erlaubt"
→ Kein Undo-Mechanismus gefordert
→ Hält die Implementierung einfach

Warum ON DELETE CASCADE auf idea_id?
→ Wenn eine Idee gelöscht wird, sollen alle Votes automatisch verschwinden
→ Ist konsistent mit der bestehenden Lösch-Warnung ("Votes werden dauerhaft gelöscht")
```

### Dependencies

```
Bereits installiert (keine neuen Packages nötig):
- @supabase/supabase-js + @supabase/ssr (Supabase Client)
- lucide-react (Icons, z.B. ChevronUp oder ArrowBigUp für Vote-Button)
- sonner (Toast-Benachrichtigungen für Fehlermeldungen)
- shadcn/ui Komponenten (Button)

Neu benötigt:
- Keine! Alles ist bereits vorhanden.
```

### Supabase-Setup (was konfiguriert werden muss)

```
1. Migration: Tabelle "votes" anlegen (user_id, idea_id, created_at)
2. RLS aktivieren: SELECT für alle eingeloggten Nutzer, INSERT nur eigene User-ID
3. Kein UPDATE/DELETE für reguläre Nutzer
4. ON DELETE CASCADE auf idea_id (Votes werden mit Idee gelöscht)
5. Index auf idea_id (Performance für Vote-Count-Aggregation)
6. Index auf user_id (Performance für spätere Abfragen)
```

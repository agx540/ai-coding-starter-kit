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

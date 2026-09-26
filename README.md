# Dennis ❤️ Nadine

**Baby & Babe – unsere kleine Anime-Welt.**
Ein kleines digitales Zuhause für zwei: Anime, Rezepte, Dates, Sammlungen, Erinnerungen, Timeline und Bucket List – romantisch, verspielt, Anime-inspiriert und komplett lokal. Unser Tag: **09.09.2026**.

---

## Features

| Bereich | Was geht |
| --- | --- |
| 🏠 **Home** | Hero mit schwebenden Herzen, Sternen & Blättern, „Tag X unserer Geschichte“, Live-Zahlen aus der Datenbank, „Was machen wir heute?“ (Date-Roulette, Anime/Rezept auslosen, Überraschung), Top 3, Bucket-Fortschritt, Timeline-Vorschau |
| 🎬 **Anime** (`/anime`) | CRUD, Status (Geplant … Abgebrochen), Genres, Bewertungen Dennis/Nadine/gemeinsam, Filter, **Top 3 mit Drag & Drop**. Startet mit unseren Anime-Interessen (nicht als gesehen markiert) |
| 🍜 **Rezepte** (`/rezepte`) | TikTok-/Social-Link *oder* manuelles Rezept, dynamische Zutaten & nummerierte Schritte, Favoriten, Filter (Favoriten, Schnell, Vegetarisch, Dessert, Hauptgericht …), Detailseite mit abhakbaren Zutaten |
| 📍 **Dates** (`/dates`) | Orte, Übernachtungen, Shopping, Restaurants, Aktivitäten · „Bereits erlebt“ / „Noch ausprobieren“ · Google-Maps-Button + optionale Karte · **Date-Roulette** mit Countdown & Flip-Animation: aus *unseren Orten* oder **Neu entdecken** (Art + Bundesland + optional Stadt → zufälliger echter Ort aus OpenStreetMap, mit einem Klick speicherbar) |
| 🎁 **Funko Pops** (`/funkos`) | Sammlung, Favoriten, Wunschliste, **Wishlist Top 10 (Drag & Drop)**, **Serien-Fortschritt** („Dragon Ball 7 / 15“ + „Noch nicht in unserer Sammlung“), **Per Foto erfassen** |
| 🧱 **LEGO** (`/lego`) | Gleiche Funktionen wie Funko (Themes statt Serien, Set-Nummer, Teile) |
| 📸 **Memories** (`/memories`) | Masonry-Galerie, Instagram-/TikTok-Vorschau mit sicherem Fallback |
| 💞 **Timeline** (`/timeline`) | Romantischer Zeitstrahl, startet mit dem 09.09.2026 |
| 🌠 **Bucket List** (`/bucket-list`) | Kategorien, Priorität, Erledigt-Status, Fortschrittsbalken |
| 🖼️ **Bilder** | Jedes Bildfeld: Link, **eigenes Foto** (lokal gespeichert) oder **passendes Online-Bild** – Vorschläge erscheinen schon beim Tippen. Anime-Cover „automatisch finden“ für alle Einträge ohne Bild |
| 🔍 **Suche** | Global über alle Bereiche · <kbd>Strg</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd> · auf Mobile über die Lupe |
| ⚙️ **Einstellungen** | Hell / Dunkel / System, Backup-Export/-Import, Reset, Speicher dauerhaft schützen |

Außerdem: Löschen immer mit Bestätigung **und** „Rückgängig“, schöne Empty States, Dark Mode als Anime-Nacht (Navy, Violett, Sterne), `prefers-reduced-motion`, Tastaturbedienung und ein paar versteckte Easter Eggs ✨ (Tipp: Logo, Herz, ein berühmter Cheatcode …).

### Ehrlich statt Fake

- **Social Previews:** Instagram/TikTok erlauben nicht jedes Embed. Deshalb gibt es immer eine Link-Karte; der offizielle Player lädt nur auf Knopfdruck („Hier abspielen“). Titel & Vorschaubild können optional per TikTok-oEmbed geholt werden – nur auf ausdrücklichen Klick.
- **Bilderkennung:** Es ist keine Vision-API eingebaut. „Per Foto erfassen“ zeigt das Foto als Spickzettel und eine schnelle Bestätigungsliste. Eine echte Erkennung lässt sich später über `registerRecognitionProvider()` in `src/features/collection/recognition.ts` anschließen.
- **Karten:** Keine Google-Maps-API nötig. Die Kartenvorschau lädt erst, wenn man sie öffnet.
- **Online-Bilder:** Nur öffentliche, schlüsselfreie Quellen – MyAnimeList (Jikan) / AniList für Anime, Wikipedia & Wikimedia Commons für Orte, TheMealDB & Commons für Rezepte, Rebrickable/Brickset-Setbilder per Set-Nummer. Für Funko Pops gibt es keine freie Bilddatenbank; dort ist ein eigenes Foto meist die beste Wahl. Vorschläge sind Vorschläge – ihr wählt aus.
- **Neu entdecken:** Die Orte kommen live aus OpenStreetMap (Overpass API). Öffnungszeiten o. Ä. sind nicht garantiert – vor dem Date kurz prüfen.

## Tech Stack

React 19 · TypeScript (strict) · Vite 7 · Tailwind CSS 4 · Lucide Icons · React Router 7 · IndexedDB (eigene kleine Abstraktion, keine Library) · Vitest + fake-indexeddb.
Schriften (Nunito, Fredoka) werden lokal gebündelt – keine externen Font-Server.

## Installation & Entwicklung

Voraussetzung: Node.js ≥ 20.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script | Zweck |
| --- | --- |
| `npm run dev` | Dev-Server mit Hot Reload |
| `npm run build` | Typecheck (`tsc -b`) + Produktionsbuild nach `dist/` |
| `npm run preview` | Build lokal ansehen |
| `npm test` | Unit-Tests (Validierung, Import/Export, Repositories, Roulette, Top-3-/Wishlist-Sortierung, Suche …) |
| `npm run typecheck` | Nur TypeScript prüfen |

## GitHub Pages Deployment

Der Workflow `.github/workflows/deploy.yml` testet und baut bei jedem Push und Pull Request. Veröffentlicht wird nur vom **Default-Branch** (`main`).

1. Repository → **Settings → Pages → Source: „GitHub Actions“** wählen.
2. Auf den Default-Branch pushen (oder den Workflow manuell starten).
3. Die Seite liegt unter `https://deeal87.github.io/dennis-nadine/`.

Details:

- Der Vite-Base-Path kommt aus `BASE_PATH` (Workflow setzt `/<repo>/`). Für eine eigene Domain oder eine User-Page die Repository-Variable `BASE_PATH` auf `/` setzen.
- SPA-Routing: Beim Build wird `index.html` nach `404.html` kopiert, damit Deep Links wie `/anime` funktionieren.
- Lokal einen Pages-Build testen: `BASE_PATH=/dennis-nadine/ npm run build && BASE_PATH=/dennis-nadine/ npm run preview`.

## Passwortschutz

Beim ersten Öffnen auf einem Gerät legt ihr direkt auf der Website ein Passwort fest; danach fragt die App bei jedem Besuch danach („Angemeldet bleiben“ merkt es sich auf dem Gerät). In den Einstellungen: **Jetzt sperren** und **Passwort ändern**.

- Es gibt keinen Server – das Passwort gilt daher pro Browser/Gerät. Gespeichert wird nur ein PBKDF2-Hash (210 000 Runden, zufälliger Salt), nie das Passwort selbst. Backups enthalten es nicht.
- Passwort vergessen: Nach zwei Fehlversuchen gibt es „Passwort vergessen?“ – das löscht die lokalen Daten dieses Geräts (danach Backup importieren).
- Ein fremder Besucher sieht eure Einträge ohnehin nie: Die Daten liegen nur in euren Browsern.

## Datenhaltung

Alle Daten liegen **ausschließlich im Browser** in IndexedDB (Datenbank `dennis-nadine`), niemals auf einem Server.

```
UI (features/*)  →  Hooks (useStore, useEntityActions, useRankingActions)
                 →  Repositories (data/repositories)  →  database.ts  →  IndexedDB
```

- `data/database.ts` ist der einzige Ort, der IndexedDB direkt anspricht (Stores: `anime`, `recipes`, `dates`, `funkos`, `lego`, `series`, `memories`, `timeline`, `bucket`, `rankings`, `settings`).
- `createRepository(store)` liefert typisiertes CRUD inkl. `restore()` für Undo.
- `data/live.ts` + `useStore()` halten einen reaktiven Cache; Änderungen werden auch an andere offene Tabs übertragen (BroadcastChannel).
- Top 3 und Wishlists sind eigene `rankings`-Einträge (geordnete ID-Listen, max. 3 bzw. 10).
- Beim allerersten Start werden nur die Anime-Interessen und der Timeline-Eintrag 09.09.2026 angelegt – keine erfundenen Erinnerungen.

## Backup / Restore

Da die Daten nur lokal liegen: **regelmäßig exportieren!**

- **Backup exportieren** (Einstellungen) → `dennis-nadine-backup-YYYY-MM-DD.json` mit allen Daten.
- **Backup importieren** → Datei wird vor dem Import geprüft: Format, App-Kennung, **Versionsnummer** (neuere Versionen werden abgelehnt) und jeder einzelne Datensatz gegen ein Schema. Ungültige Einträge werden angezeigt und **nicht** übernommen. Der Import ersetzt danach alle lokalen Daten in einer einzigen Transaktion.
- **Alle lokalen Daten löschen** → nur nach Eintippen von „LÖSCHEN“.

Format:

```json
{
  "app": "dennis-nadine",
  "version": 1,
  "exportedAt": "2026-09-09T12:00:00.000Z",
  "data": { "anime": [], "recipes": [], "dates": [], "funkos": [], "lego": [], "series": [], "memories": [], "timeline": [], "bucket": [], "rankings": [], "settings": [] }
}
```

## Datenschutz

Keine Accounts, kein Backend, keine Analytics, kein Tracking. Hochgeladene Fotos bleiben im Browser (und im Backup). Für Bildvorschläge und „Neu entdecken“ werden nur Suchbegriffe (Titel, Ort, Bundesland) an die genannten öffentlichen Dienste geschickt; automatische Vorschläge lassen sich in den Einstellungen abschalten. Karten, Embeds und die optionale TikTok-Vorschau laden nur auf Klick. Bilder werden mit `referrerpolicy="no-referrer"` geladen.

## Projektstruktur

```
dennis-nadine/
├── .github/workflows/     # Test, Build & GitHub-Pages-Deployment
├── index.html                  # Theme wird vor dem ersten Paint gesetzt
├── public/favicon.svg
├── vite.config.ts              # Base-Path, 404-Fallback, Chunks, Vitest
└── src/
    ├── app/                    # App, Routen (lazy), Pfade, Startscreen
    ├── components/
    │   ├── ui/                 # Button, Modal (<dialog>), Toast, ConfirmDialog, Formularfelder,
    │   │                       # RatingStars, SmartImage, SortableList (Drag & Drop), ProgressBar, Tag …
    │   ├── layout/             # AppShell, Sidebar, Bottom-Navigation, Logo, ThemeSwitcher, ErrorBoundary
    │   ├── cards/              # MediaCard, DetailModal
    │   ├── collection/         # RankingBoard (Top 3 / Top 10)
    │   ├── media/              # MediaPreview (Social), MapPreview
    │   └── animations/         # SVG-Deko, Partikel, Himmel, Burst, Easter Eggs
    ├── features/
    │   ├── home/ anime/ recipes/ dates/ memories/ timeline/ bucket-list/ settings/ search/
    │   ├── collection/         # Gemeinsame Logik für Funko & LEGO (Config-getrieben)
    │   ├── funkos/ lego/       # Nur die jeweilige Konfiguration
    │   └── roulette/           # Date-Roulette & „Was machen wir heute?“
    ├── data/
    │   ├── database.ts         # IndexedDB-Zugriff
    │   ├── events.ts, live.ts  # Änderungs-Events & reaktiver Cache
    │   ├── repositories/       # CRUD, Rankings, Settings
    │   ├── backup/             # Schema-Validierung, Export/Import
    │   └── seed/               # Initialdaten
    ├── hooks/                  # useStore, useEntityActions, useEditor, useDraft, useTheme …
    ├── lib/                    # Reine Helfer: ranking, social, maps, url, date, filters, validation …
    ├── types/models.ts         # Datenmodell
    ├── styles/index.css        # Design-Tokens (Hell/Dunkel), Animationen
    └── test/                   # Test-Setup
```

### Erweitern

- **Neuer Roulette-Filter:** Eintrag in `ROULETTE_FILTERS` (`features/dates/roulette.ts`).
- **Neue Listenfilter:** `FilterDef`-Arrays in den jeweiligen `config.ts`.
- **Bilderkennung:** `RecognitionProvider` implementieren und registrieren.
- **Neue Bildquelle:** Provider in `features/image-search/providers.ts`, Zuordnung in `search.ts`.
- **Neue „Neu entdecken“-Art:** Eintrag in `DISCOVER_TYPES` (`features/discover/config.ts`) mit OpenStreetMap-Tags.
- **Neues Datenfeld:** Typ in `types/models.ts`, Schema in `data/backup/schema.ts`, Formular im Feature.

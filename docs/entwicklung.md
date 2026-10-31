# Entwicklung

Voraussetzung: Node.js 26. Für die Doku zusätzlich Python 3.

```bash
git clone https://github.com/firsttris/Flugwetterdaten && cd Flugwetterdaten
npm install
npm run dev
```

Die Seite spricht standardmäßig den produktiven Worker an. Für einen lokalen Worker:

```bash
cd worker && npm install && npm run dev      # http://localhost:8787
VITE_API_BASE=http://localhost:8787 npm run dev
```

## Projektstruktur

```
src/                 Webseite (React, Tailwind, shadcn/ui-Komponenten in src/components/ui)
public/              statische Dateien: Manifest, Icons, Service Worker, Screenshots fürs Manifest
worker/              Cloudflare Worker (METAR/TAF-Proxy, Wind-Alarm)
docs/                diese Dokumentation (MkDocs Material) und die Bilder für README und Doku
scripts/             Icons, Screenshots, Demo-Daten, Social Preview
.github/workflows/   CI, Deployment von App, Doku und Worker, Screenshots
```

## Checks

Vor jedem Push:

```bash
npm run build                                 # Typecheck und Build der App
(cd worker && npm run typecheck)              # Worker
mkdocs build --strict                         # Doku, wenn docs/ oder mkdocs.yml geändert wurden
```

## Dokumentation lokal

```bash
pip install -r requirements-docs.txt
mkdocs serve                                  # http://127.0.0.1:8000
```

## Icons und Screenshots

| Befehl | Was |
|---|---|
| `npm run icons` | erzeugt `public/icon.svg` und `public/icons/*.png` aus `scripts/app-icons.mjs` |
| `npm run screenshots` | baut die App, startet die Vorschau und nimmt mit `scripts/demo-data.mjs` alle Bilder in `docs/` und `public/screenshots/` auf |

Beide brauchen Chromium von Playwright; wo es nicht automatisch gefunden wird, den Pfad mit
`CHROMIUM_PATH` angeben. Die Screenshots laufen mit fester Uhrzeit, festen Daten und ruhenden
Animationen, damit ein unverändertes Aussehen auch gleiche Bilder ergibt.

## Einen anderen Spot einstellen

| Was | Wo |
|---|---|
| Flughafen (ICAO) | `worker/src/index.ts`: `STATION` |
| Position der Vorhersage | `src/lib/config.ts` und `worker/src/index.ts`: `SPOT` |
| Grüner Windbereich | `src/lib/config.ts` und `worker/src/index.ts`: `GREEN_SECTOR` |
| Pegel | `src/lib/api.ts`: `PEGEL` (Pegelonline-Kürzel) |
| Wassertemperatur | `src/lib/api.ts`: `fetchWaterTemp` (LUBW-Messstelle) |
| Texte und Links | `src/App.tsx`, `src/components/links-card.tsx` |

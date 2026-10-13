# Hinweise für Claude

## Dokumentation

Die Dokumentation liegt in `docs/` (<https://wetter.teufel-it.de/docs/>), gebaut mit MkDocs Material.
Vor einer Änderung die betroffenen Seiten lesen: `architektur.md` für das Zusammenspiel,
`datenquellen.md` für Quellen und Berechnungen, `wind-alarm.md` für den Alarm. Links in README und
Doku zeigen auf die Website, nicht auf `docs/*.md`.

## Mit jeder Änderung

Im selben Pull Request anpassen, was die Änderung betrifft, und nur das:

- die Seiten in `docs/`, die das Verhalten beschreiben;
- die README, wenn eine sichtbare Funktion dazukommt, sich ändert oder wegfällt;
- die Demo-Daten in `scripts/demo-data.mjs`, wenn eine neue Datenquelle dazukommt;
- nach einer Änderung am Aussehen die Screenshots: **Actions → Update screenshots → Run workflow**,
  dann die neuen Bilder ansehen.

## Checks

Grün vor jedem Push, danach die CI prüfen:

```sh
npm run build                        # Typecheck und Build der App
(cd worker && npm run typecheck)     # Worker
mkdocs build --strict                # wenn docs/ oder mkdocs.yml geändert wurden
```

## Pull Requests

- Eine Sache pro Pull Request.
- Vor jedem Push prüfen, ob der Pull Request des Branches noch offen ist. Ist er gemerged, vom
  aktuellen `origin/main` neu anfangen und einen **neuen** Pull Request öffnen.
- Nichts umsetzen oder pushen, bevor der Nutzer ausdrücklich zugestimmt hat; Vorschläge erst als
  Mockup oder Beschreibung zeigen.

## Arbeitsregeln

- Sprache: Oberfläche, Doku, Commits und Pull Requests auf Deutsch; Code-Bezeichner auf Englisch.
- Die App gibt keine Bewertung wie „gut“ oder „schlecht“ ab und schreibt nirgends Spot-Wissen
  (etwa „Düse“) hin. Nord-Ost (20–80°) wird nur farblich grün markiert.

## Code-Stil

Technikwahl nach `tech-stack.md` in firsttris/workflows. Abweichungen: npm statt pnpm, kein Biome
(noch nicht eingerichtet), eigene SVG-Diagramme statt uPlot, weil es nur wenige Dutzend Punkte sind.

Funktional, nicht objektorientiert: reine Funktionen, Seiteneffekte am Rand, Funktionskomponenten und
Hooks. Eine Datei macht eine Sache.

## Projekt-Besonderheiten

- Zeiten immer in `Europe/Berlin` formatieren (`src/lib/units.ts`), nie mit der Zeitzone des Geräts.
- Grüner Bereich, Position und Station stehen doppelt: in `src/lib/config.ts` und in
  `worker/src/index.ts`. Beide gleich halten.
- Der Worker deployt über `.github/workflows/deploy-worker.yml`, App und Doku über `deploy.yml`.

# Flugwetterdaten

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=flat-square&logo=tailwindcss&logoColor=38BDF8)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

> Wind und Wasser an der NATO-Rampe Rheinmünster: aktueller Wind vom Baden-Airpark (METAR EDSB), Vorhersage, Rhein-Pegel und Wind-Alarm aufs Handy.

**[wetter.teufel-it.de](https://wetter.teufel-it.de)**

## Funktionen

- **Wind jetzt**: Windstärke, Böen und Richtung aus dem METAR, Windkompass, Verlauf der letzten 6 Stunden
- **Vorhersage 3 Tage**: Stunde für Stunde aus dem DWD-Modell ICON (Open-Meteo)
- **Rhein**: Wassertemperatur (LUBW), Pegel Iffezheim mit Trend, geschätzte Strömung, Hochwasserstatus (Pegelonline)
- **Flugwetter**: Temperatur, QNH, Sicht, Wolken, Roh-METAR und TAF
- **Wind-Alarm**: Push-Nachricht, wenn der Wind aus der richtigen Richtung kommt und stark genug ist, optional auch am Vorabend nach Vorhersage
- **Einstellungen**: Windeinheit (kn, km/h, Bft), Hell/Dunkel, Alarm-Schwelle
- Installierbar als App (PWA)

Windrichtungen von 20° bis 80° werden grün markiert (`src/lib/config.ts` und `worker/src/index.ts`).

## Aufbau

| Teil | Technik | Ordner |
|------|---------|--------|
| Webseite | Vite, React, TypeScript, Tailwind CSS, shadcn/ui | `src/`, `public/` |
| API & Wind-Alarm | Cloudflare Worker mit KV und Cron | `worker/` |
| Deployment | GitHub Actions → GitHub Pages | `.github/workflows/` |

## Datenquellen

| Daten | Quelle | Abruf |
|-------|--------|-------|
| METAR / TAF EDSB | [aviationweather.gov](https://aviationweather.gov/data/api/) | über den Worker (kein CORS) |
| Windvorhersage | [Open-Meteo](https://open-meteo.com/) (DWD ICON) | direkt |
| Pegel, Abfluss, Hochwasser | [Pegelonline WSV](https://www.pegelonline.wsv.de/) | direkt |
| Wassertemperatur | [LUBW NIZ](https://niz.baden-wuerttemberg.de) | direkt |

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Standardmäßig spricht die Seite den produktiven Worker an. Für einen lokalen Worker `VITE_API_BASE=http://localhost:8787 npm run dev`.

## Deployment

### Webseite

Jeder Push auf `main` baut die Seite und veröffentlicht sie auf GitHub Pages.
Einmalig nötig: unter **Settings → Pages → Build and deployment → Source** „GitHub Actions“ auswählen.

### Worker

Jeder Push auf `main`, der etwas in `worker/` ändert, lädt den Worker automatisch zu Cloudflare hoch (`.github/workflows/deploy-worker.yml`). Von Hand starten geht unter **Actions → Deploy Cloudflare Worker → Run workflow**.

Einmalig einrichten:

1. **API-Token** bei Cloudflare unter *My Profile → API Tokens* mit der Vorlage „Edit Cloudflare Workers“ erstellen.
2. **GitHub Secrets** unter *Settings → Secrets and variables → Actions* anlegen:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (Cloudflare-Dashboard, Übersicht rechts)
   - `VAPID_PRIVATE_KEY` (nur für den Wind-Alarm, siehe unten)

Damit laufen METAR und TAF.

**Wind-Alarm** zusätzlich einmalig (der KV-Speicher `SUBSCRIPTIONS` ist schon angelegt und in `wrangler.toml` eingetragen):

```bash
cd worker
npm install

# VAPID-Schlüssel erzeugen
npm run vapid
```

Den öffentlichen Schlüssel in `wrangler.toml` bei `VAPID_PUBLIC_KEY` eintragen und den privaten Schlüssel als GitHub Secret `VAPID_PRIVATE_KEY` speichern. Beim nächsten Deploy setzt der Workflow ihn als Worker-Secret.

Der Worker heißt in `wrangler.toml` wie der bisherige (`silent-night-c341`), damit die URL gleich bleibt.

## Lizenz

MIT

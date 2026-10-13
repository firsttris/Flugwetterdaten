# Betrieb und Deployment

Alles wird über GitHub Actions veröffentlicht. Nach einem Merge auf `main` ist die neue Version in
wenigen Minuten online.

| Workflow | Wann | Was |
|---|---|---|
| `ci.yml` | jeder Pull Request und Push auf `main` | baut die App, prüft den Worker, baut die Doku mit `--strict` |
| `deploy.yml` | Push auf `main` | baut App und Doku (`dist/` und `dist/docs/`) und veröffentlicht beides auf GitHub Pages |
| `deploy-worker.yml` | Push auf `main` mit Änderungen in `worker/` | Typecheck und `wrangler deploy`, setzt den privaten VAPID-Schlüssel |
| `screenshots.yml` | von Hand | nimmt alle Bilder neu auf und committet die geänderten |

## GitHub Pages

- **Settings → Pages → Source:** „GitHub Actions“.
- **Custom domain:** `wetter.teufel-it.de`, **Enforce HTTPS** an. Mit der Quelle „GitHub Actions“
  zählt nur diese Einstellung; die Datei `public/CNAME` allein reicht nicht.
- Die Domain läuft über Cloudflare. Hängt die DNS-Prüfung bei GitHub, den Eintrag kurz auf
  „DNS only“ stellen, bis Prüfung und Zertifikat grün sind.

Die App liegt unter `/`, die Dokumentation unter `/docs/`.

## Cloudflare Worker

Einmalig einzurichten, danach aktualisiert die CI den Worker selbst:

1. **API-Token** bei Cloudflare unter *My Profile → API Tokens*, Vorlage „Edit Cloudflare Workers“.
2. **GitHub Secrets** unter *Settings → Secrets and variables → Actions*:

    | Secret | Inhalt |
    |---|---|
    | `CLOUDFLARE_API_TOKEN` | das Token aus Schritt 1 |
    | `CLOUDFLARE_ACCOUNT_ID` | Konto-ID aus dem Cloudflare-Dashboard |
    | `VAPID_PRIVATE_KEY` | privater VAPID-Schlüssel (JSON) für den Wind-Alarm |

3. **KV-Speicher** `SUBSCRIPTIONS` (`npx wrangler kv namespace create SUBSCRIPTIONS`), die ID steht in
   `worker/wrangler.toml`.
4. **VAPID-Schlüssel** mit `npm run vapid`: den öffentlichen in `worker/wrangler.toml` bei
   `VAPID_PUBLIC_KEY`, den privaten als Secret `VAPID_PRIVATE_KEY`. Beide müssen aus demselben Lauf
   stammen.

Der Worker heißt `silent-night-c341`; die Webseite spricht ihn unter
`https://silent-night-c341.tristanteufel.workers.dev` an (`src/lib/config.ts`, überschreibbar mit
`VITE_API_BASE`).

!!! warning "Neue Schlüssel"
    Wer den VAPID-Schlüssel wechselt, macht alle bestehenden Anmeldungen ungültig. Alle Nutzer müssen
    den Wind-Alarm dann neu einschalten.

## Screenshots

Nach einer sichtbaren Änderung: **Actions → Update screenshots → Run workflow**. Der Workflow nutzt
den gemeinsamen Screenshot-Workflow aus
[firsttris/workflows](https://github.com/firsttris/workflows) im offiziellen Playwright-Image, nimmt
die Bilder mit festen Demo-Daten auf und committet nur die geänderten.

## Repository-Einstellungen

| Einstellung | Wert |
|---|---|
| Description | Wind, Vorhersage und Rhein-Pegel an der NATO-Rampe Rheinmünster, mit Wind-Alarm aufs Handy |
| Website | `https://wetter.teufel-it.de` |
| Topics | `pwa`, `react`, `tailwindcss`, `shadcn-ui`, `cloudflare-workers`, `web-push`, `metar`, `taf`, `wind`, `windsurfing`, `kitesurfing`, `weather`, `rhein`, `pegel`, `open-meteo` |
| Social preview | `docs/social-preview.png` |

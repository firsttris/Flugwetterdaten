#!/usr/bin/env bash
# Baut die App, startet die Vorschau und nimmt die Bilder auf (scripts/screenshots.mjs): npm run screenshots
# Der Workflow „Update screenshots“ führt das im Playwright-Image aus und committet die Bilder.
set -euo pipefail
PORT=4180
npm run build
node node_modules/vite/bin/vite.js preview --port $PORT --strictPort --host 127.0.0.1 >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true' EXIT
for i in $(seq 60); do
  node -e "fetch('http://127.0.0.1:$PORT/').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))" && break
  (( i == 60 )) && { echo "Die Vorschau ist nicht gestartet" >&2; exit 1; }
  sleep 1
done
BASE=http://127.0.0.1:$PORT node scripts/screenshots.mjs

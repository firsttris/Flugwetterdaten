// Das App-Icon in allen Größen: public/icon.svg (Favicon) und public/icons/*.png
// („Zum Startbildschirm“, Manifest, iOS). Nach einer Änderung am Logo neu ausführen:
//   node scripts/app-icons.mjs        (CHROMIUM_PATH=/pfad/zu/chromium, falls nötig)
import { mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Wasser-Verlauf wie in der App (--water), Windlinien weiß, der grüne Bereich des Kompasses
const DEFS =
  '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22b8d6"/><stop offset=".55" stop-color="#0e7490"/><stop offset="1" stop-color="#0b3b52"/></linearGradient>'

const pt = (r, deg) => [12 + r * Math.sin((deg * Math.PI) / 180), 12 - r * Math.cos((deg * Math.PI) / 180)]
const [ax, ay] = pt(8.6, 20)
const [bx, by] = pt(8.6, 80)
const MARK = `
  <circle cx="12" cy="12" r="8.6" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1.1"/>
  <path d="M${ax.toFixed(2)} ${ay.toFixed(2)}A8.6 8.6 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}" fill="none" stroke="#4ade80" stroke-width="2.1" stroke-linecap="round"/>
  <g fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" transform="translate(12.5 11.8) scale(.62) translate(-12 -12)">
    <path d="M12.8 19.6A2 2 0 1 0 14 16H2"/><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2"/><path d="M9.8 4.4A2 2 0 1 1 11 8H2"/>
  </g>`

/** inset: Anteil der Seite für das Zeichen; round: Eckenradius (0 = Quadrat für Masken und iOS). */
const icon = (round, inset) => {
  const s = 24 / inset
  const o = (s - 24) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-o} ${-o} ${s} ${s}"><defs>${DEFS}</defs><rect x="${-o}" y="${-o}" width="${s}" height="${s}" rx="${round * s}" fill="url(#g)"/>${MARK}</svg>`
}

const ICONS = [
  { file: 'icon-192.png', size: 192, svg: icon(0.24, 0.92) },
  { file: 'icon-512.png', size: 512, svg: icon(0.24, 0.92) },
  // maskable: volles Quadrat, Zeichen im sicheren Kreis (80 %), den jede Maske stehen lässt
  { file: 'icon-maskable-512.png', size: 512, svg: icon(0, 0.72) },
  // iOS rundet selbst und zeigt Transparenz schwarz
  { file: 'apple-touch-icon.png', size: 180, svg: icon(0, 0.86) },
]

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icon.svg', `${icon(0.24, 0.92)}\n`)
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const p = await b.newPage()
for (const { file, size, svg } of ICONS) {
  await p.setViewportSize({ width: size, height: size })
  await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`)
  await p.screenshot({ path: `public/icons/${file}`, omitBackground: true })
  console.log(`public/icons/${file}`)
}
await b.close()

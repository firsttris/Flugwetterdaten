// Nimmt die Bilder für README, Dokumentation, App-Manifest und Social Preview auf, mit den
// festen Demo-Daten aus scripts/demo-data.mjs. Erwartet die gebaute App unter BASE:
//   npm run screenshots   (scripts/screenshots.sh baut, startet die Vorschau und ruft dieses Skript)
//   CHROMIUM_PATH=/pfad/zu/chromium node scripts/screenshots.mjs
import { mkdirSync, readFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { NOW, respond } from './demo-data.mjs'

const BASE = process.env.BASE ?? 'http://127.0.0.1:4180'
mkdirSync('docs/assets', { recursive: true })
mkdirSync('public/screenshots', { recursive: true })

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })

/** Neue Seite mit Demo-Daten, fester Uhrzeit und ruhenden Animationen (gleiches Bild bei jedem Lauf). */
async function open({ width, height, scale = 2, dark = false, settings = {} }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: dark ? 'dark' : 'light',
    reducedMotion: 'reduce',
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    serviceWorkers: 'block', // sonst sieht page.route die Anfragen nicht
  })
  await ctx.addInitScript(
    ({ settings }) => {
      // Gleiche Windlinien bei jedem Lauf
      let seed = 42
      Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
      localStorage.setItem('rm-settings', JSON.stringify(settings))
    },
    { settings },
  )
  await ctx.route(
    (url) => url.origin !== new URL(BASE).origin,
    async (route) => {
      const body = respond(route.request().url())
      if (body === null) return route.abort()
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    },
  )
  const page = await ctx.newPage()
  await page.clock.setFixedTime(NOW)
  await page.goto(BASE)
  await page.getByText('Vorhersage 5 Tage').waitFor()
  await page.locator('text=Böen').first().waitFor()
  await page.waitForTimeout(1500)
  return page
}

const shot = async (page, path, opts = {}) => {
  await page.screenshot({ path, ...opts })
  console.log(path)
}

// README-Titelbild: Desktop, dunkel
let p = await open({ width: 1280, height: 800, scale: 1.5, dark: true })
await shot(p, 'docs/screenshot.png', { fullPage: true })
await shot(p, 'public/screenshots/desktop.png')
await shot(p, 'docs/screenshot-forecast.png', { fullPage: true, clip: await box(p, 'Vorhersage 5 Tage') })
await p.getByText('Vorhersage (TAF)').click()
await p.waitForTimeout(300)
await shot(p, 'docs/screenshot-flight.png', { fullPage: true, clip: await box(p, 'Flugwetter EDSB') })
await p.context().close()

// Handy hell und dunkel
p = await open({ width: 390, height: 844 })
await shot(p, 'docs/screenshot-phone.png')
await shot(p, 'public/screenshots/phone.png')
await p.getByRole('button', { name: 'Einstellungen' }).click()
await p.waitForTimeout(500)
await shot(p, 'docs/screenshot-settings.png')
await p.context().close()

p = await open({ width: 390, height: 844, dark: true })
await shot(p, 'docs/screenshot-phone-dark.png')
await p.context().close()

// Einheit km/h und Wind-Alarm-Einstellungen
p = await open({ width: 390, height: 844, dark: true, settings: { unit: 'kmh' } })
await shot(p, 'docs/screenshot-phone-kmh.png')
await p.context().close()

// Social Preview (Settings → Social preview), 1280×640
const social = await browser.newPage({ viewport: { width: 1280, height: 640 } })
const html = readFileSync('scripts/social-preview.html', 'utf8')
  .replace('ICON_SVG', readFileSync('public/icon.svg', 'utf8'))
  .replace('FONT_WOFF2', readFileSync('node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2').toString('base64'))
  .replace('PHONE_PNG', `data:image/png;base64,${readFileSync('docs/screenshot-phone-dark.png').toString('base64')}`)
await social.setContent(html)
await social.waitForTimeout(300)
await shot(social, 'docs/social-preview.png')

await browser.close()

/** Rahmen der Karte mit dieser Überschrift. */
async function box(page, title) {
  const card = page.locator('[data-slot="card"]').filter({ has: page.getByText(title, { exact: true }) }).first()
  await card.scrollIntoViewIfNeeded()
  const b = await card.boundingBox()
  const pad = 12
  const scroll = await page.evaluate(() => window.scrollY)
  return { x: Math.max(0, b.x - pad), y: Math.max(0, b.y + scroll - pad), width: b.width + 2 * pad, height: b.height + 2 * pad }
}

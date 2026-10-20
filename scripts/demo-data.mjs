// Feste Demo-Daten für die Screenshots: ein Sommernachmittag mit Nord-Ost-Wind.
// Alle Werte hängen nur von NOW ab, damit die Bilder bei jedem Lauf gleich aussehen.

/** Uhrzeit der Bilder: 14.06.2026, 15:50 Uhr in Deutschland (13:50 UTC). */
export const NOW = Date.parse('2026-06-14T13:50:00Z')
const S = Math.floor(NOW / 1000)
const H = S - (S % 3600) // volle Stunde

// --- METAR der letzten 6 Stunden (neueste zuerst), Wind dreht auf Nord-Ost und frischt auf
const history = [
  [70, 7, 0], [60, 8, 0], [55, 9, 0], [50, 10, 15], [45, 11, 16], [50, 12, 17], [45, 13, 19],
  [50, 14, 20], [45, 15, 21], [50, 15, 22], [55, 16, 22], [45, 17, 23], [50, 17, 24],
]
export const metar = history
  .map(([dir, spd, gst], i) => {
    const t = S - (history.length - 1 - i) * 1800
    const hhmm = new Date(t * 1000).toISOString().slice(8, 16).replace(/[-T:]/g, '')
    const wind = `${String(dir).padStart(3, '0')}${String(spd).padStart(2, '0')}${gst ? `G${gst}` : ''}KT`
    return {
      icaoId: 'EDSB',
      obsTime: t,
      temp: 24,
      dewp: 12,
      wdir: dir,
      wspd: spd,
      wgst: gst || null,
      visib: '6+',
      altim: 1019,
      rawOb: `METAR EDSB ${hhmm}Z ${wind} 9999 FEW045 24/12 Q1019`,
      cover: 'FEW',
      clouds: [{ cover: 'FEW', base: 4500 }],
      fltCat: 'VFR',
    }
  })
  .reverse()

export const taf = [
  {
    rawTAF: 'TAF EDSB 141100Z 1412/1512 05015G25KT 9999 FEW045 BECMG 1419/1421 09007KT',
    issueTime: new Date((S - 3 * 3600) * 1000).toISOString(),
    fcsts: [
      { timeFrom: H - 2 * 3600, timeTo: H + 6 * 3600, fcstChange: null, probability: null, wdir: 50, wspd: 15, wgst: 25, visib: '6+', wxString: null, clouds: [] },
      { timeFrom: H + 6 * 3600, timeTo: H + 8 * 3600, fcstChange: 'BECMG', probability: null, wdir: 90, wspd: 7, wgst: null, visib: null, wxString: null, clouds: [] },
    ],
  },
]

// --- Open-Meteo: 5 Tage, ab Mitternacht deutscher Zeit (UTC+2 im Sommer)
const day0 = Math.floor(Date.parse('2026-06-14T00:00:00+02:00') / 1000)
const bell = (h, peak, top, base, w) => base + (top - base) * Math.exp(-((h - peak) ** 2) / (2 * w * w))
const days = [
  (h) => [h < 19 ? 45 + ((h * 7) % 20) : 90, h < 19 ? bell(h, 15, 18, 6, 3.5) : 8 - (h - 19) * 0.6],
  (h) => [220 + ((h * 5) % 20), bell(h, 14, 13, 4, 3)],
  (h) => (h < 12 ? [(350 + h * 3) % 360, 7 + (h % 3)] : [30 + ((h * 4) % 20), bell(h, 16, 24, 10, 3)]),
  (h) => [260 + ((h * 3) % 30), bell(h, 15, 16, 5, 4)],
  (h) => [60 + ((h * 5) % 25), bell(h, 13, 11, 3, 3.5)],
]
const hourly = { time: [], wind_speed_10m: [], wind_gusts_10m: [], wind_direction_10m: [] }
days.forEach((f, d) => {
  for (let h = 0; h < 24; h++) {
    const [dir, spd] = f(h)
    hourly.time.push(day0 + d * 86400 + h * 3600)
    hourly.wind_speed_10m.push(Math.round(spd * 10) / 10)
    hourly.wind_gusts_10m.push(Math.round(spd * 14) / 10)
    hourly.wind_direction_10m.push(dir)
  }
})
export const forecast = {
  hourly,
  daily: {
    time: days.map((_, d) => day0 + d * 86400),
    sunrise: days.map((_, d) => day0 + d * 86400 + 5 * 3600 + 18 * 60),
    sunset: days.map((_, d) => day0 + d * 86400 + 21 * 3600 + 32 * 60),
  },
}

// --- Rhein: Pegelonline Iffezheim und LUBW
const iso = (t) => new Date(t * 1000).toISOString().replace('.000Z', '+00:00')
export const pegelStation = {
  shortname: 'IFFEZHEIM',
  timeseries: [
    { shortname: 'Q', currentMeasurement: { timestamp: iso(S - 900), value: 1120 } },
    { shortname: 'W', currentMeasurement: { timestamp: iso(S - 900), value: 412, stateMnwMhw: 'normal', stateNswHsw: 'normal' } },
  ],
}
export const pegelHistory = [{ timestamp: iso(S - 86400), value: 398 }, { timestamp: iso(S - 900), value: 412 }]
export const waterTemp = { tempchart: { chartSubtitle: { text: 'letzter Wert 14.06.2026 15:00 Uhr 21,4 °C' } } }

/** Antwort für eine abgefangene Anfrage der App, sonst null. */
export function respond(url) {
  if (url.includes('/metar')) return metar
  if (url.includes('/taf')) return taf
  if (url.includes('/config')) return { vapidPublicKey: null }
  if (url.includes('api.open-meteo.com')) return forecast
  if (url.includes('pegelonline') && url.includes('/W/measurements')) return pegelHistory
  if (url.includes('pegelonline')) return pegelStation
  if (url.includes('lupo-cloud.de')) return waterTemp
  return null
}

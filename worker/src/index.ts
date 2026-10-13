/**
 * Cloudflare Worker für wetter.teufel-it.de
 *
 * - GET  /metar?hours=6   METAR EDSB von aviationweather.gov (mit CORS, 60 s Cache)
 * - GET  /taf             TAF EDSB (10 min Cache)
 * - GET  /config          öffentlicher VAPID-Schlüssel für den Wind-Alarm
 * - POST /subscribe       Gerät für den Wind-Alarm anmelden / Einstellungen ändern
 * - POST /unsubscribe     Gerät abmelden
 * - GET  /message         Text der letzten Benachrichtigung (holt der Service Worker ab)
 * - Cron alle 30 min      prüft den METAR (und um 18 Uhr die Vorhersage) und schickt Pushes
 */
import { sendPush } from "./push";

export interface Env {
  SUBSCRIPTIONS: KVNamespace; // fehlt, solange der Wind-Alarm nicht eingerichtet ist
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string; // JWK als JSON (Secret)
  VAPID_SUBJECT: string;
}

const STATION = "EDSB";
const SPOT = { lat: 48.78, lon: 8.05 };
const GREEN_SECTOR = { from: 20, to: 80 };
const TZ = "Europe/Berlin";

const isGreen = (dir: unknown): dir is number =>
  typeof dir === "number" && dir >= GREEN_SECTOR.from && dir <= GREEN_SECTOR.to;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS, ...extra } });

// --- Typen -----------------------------------------------------------------

type Metar = { obsTime: number; wdir: number | "VRB" | null; wspd: number; wgst?: number | null };

type Prefs = {
  minWind: number; // kn
  daytime: boolean;
  freq: number; // Stunden zwischen zwei Alarmen; 1 = höchstens 1× am Tag
  forecastAlarm: boolean;
  unit: "kn" | "kmh" | "bft";
};

type Subscription = {
  endpoint: string;
  prefs: Prefs;
  lastSent: number; // ms
  lastSentDay: string; // YYYY-MM-DD (Ortszeit)
  lastForecastDay: string;
  message: { title: string; body: string } | null;
};

// --- Hilfsfunktionen -------------------------------------------------------

async function sha256(text: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const subKey = async (endpoint: string) => `sub:${await sha256(endpoint)}`;

/** Datum und Uhrzeit in deutscher Ortszeit. */
function local(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) % 24, time: `${parts.hour}:${parts.minute}` };
}

const BEAUFORT_KN = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];
function wind(kn: number, unit: Prefs["unit"]) {
  if (unit === "kmh") return `${Math.round(kn * 1.852)} km/h`;
  if (unit === "bft") return `${BEAUFORT_KN.filter((t) => kn >= t).length} Bft`;
  return `${Math.round(kn)} kn`;
}
const deg = (d: number) => `${String(Math.round(d)).padStart(3, "0")}°`;

/** Holt eine URL mit Cloudflare-Cache. */
async function cachedFetch(url: string, ttl: number, ctx: ExecutionContext) {
  const cache = caches.default;
  const key = new Request(url);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(url, { headers: { "User-Agent": "wetter.teufel-it.de (Wind-Info Rheinmünster)" } });
  if (!res.ok) return res;
  const body = await res.text();
  const fresh = new Response(body, { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttl}` } });
  ctx.waitUntil(cache.put(key, fresh.clone()));
  return fresh;
}

async function proxy(url: string, ttl: number, ctx: ExecutionContext) {
  try {
    const res = await cachedFetch(url, ttl, ctx);
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttl}`, ...CORS },
    });
  } catch (err) {
    return json({ error: (err as Error).message }, 502);
  }
}

const metarUrl = (hours: number) => `https://aviationweather.gov/api/data/metar?ids=${STATION}&format=json&hours=${hours}`;

// --- HTTP ------------------------------------------------------------------

function validPrefs(p: Partial<Prefs> | undefined): Prefs {
  const minWind = Math.min(40, Math.max(1, Number(p?.minWind) || 12));
  const freq = Number(p?.freq) === 3 ? 3 : 1;
  const unit = p?.unit === "kmh" || p?.unit === "bft" ? p.unit : "kn";
  return { minWind, daytime: p?.daytime !== false, freq, forecastAlarm: p?.forecastAlarm === true, unit };
}

async function subscribe(request: Request, env: Env) {
  const body = (await request.json().catch(() => null)) as { subscription?: { endpoint?: string }; prefs?: Partial<Prefs> } | null;
  const endpoint = body?.subscription?.endpoint;
  if (!endpoint || !endpoint.startsWith("https://")) return json({ error: "Ungültige Anmeldung" }, 400);
  const key = await subKey(endpoint);
  const existing = await env.SUBSCRIPTIONS.get<Subscription>(key, "json");
  const sub: Subscription = {
    endpoint,
    prefs: validPrefs(body?.prefs),
    lastSent: existing?.lastSent ?? 0,
    lastSentDay: existing?.lastSentDay ?? "",
    lastForecastDay: existing?.lastForecastDay ?? "",
    message: existing?.message ?? null,
  };
  await env.SUBSCRIPTIONS.put(key, JSON.stringify(sub));
  return json({ ok: true });
}

async function unsubscribe(request: Request, env: Env) {
  const body = (await request.json().catch(() => null)) as { endpoint?: string } | null;
  if (!body?.endpoint) return json({ error: "endpoint fehlt" }, 400);
  await env.SUBSCRIPTIONS.delete(await subKey(body.endpoint));
  return json({ ok: true });
}

async function message(url: URL, env: Env) {
  const endpoint = url.searchParams.get("endpoint");
  const sub = endpoint && env.SUBSCRIPTIONS ? await env.SUBSCRIPTIONS.get<Subscription>(await subKey(endpoint), "json") : null;
  return json(sub?.message ?? { title: "Rheinmünster Wind", body: "Neue Windmeldung – App öffnen für Details." });
}

// --- Wind-Alarm ------------------------------------------------------------

type OpenMeteo = {
  hourly: { time: string[]; wind_speed_10m: number[]; wind_gusts_10m: number[]; wind_direction_10m: number[] };
  daily: { time: string[]; sunrise: string[]; sunset: string[] };
};

async function loadForecast(): Promise<OpenMeteo | null> {
  const params = new URLSearchParams({
    latitude: String(SPOT.lat),
    longitude: String(SPOT.lon),
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    daily: "sunrise,sunset",
    wind_speed_unit: "kn",
    models: "icon_seamless",
    forecast_days: "2",
    timezone: TZ,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  return res.ok ? ((await res.json()) as OpenMeteo) : null;
}

/** Erste und letzte Stunde morgen (7–20 Uhr) mit grünem Wind über der Schwelle. */
export function tomorrowWindow(fc: OpenMeteo, tomorrow: string, minWind: number) {
  const hours = fc.hourly.time
    .map((t, i) => ({ t, h: Number(t.slice(11, 13)), spd: fc.hourly.wind_speed_10m[i], dir: fc.hourly.wind_direction_10m[i] }))
    .filter((x) => x.t.startsWith(tomorrow) && x.h >= 7 && x.h <= 20 && isGreen(x.dir) && x.spd >= minWind);
  if (!hours.length) return null;
  const peak = hours.reduce((a, b) => (b.spd > a.spd ? b : a));
  return { from: hours[0].h, to: hours[hours.length - 1].h + 1, peak };
}

export async function runAlarm(env: Env, now = new Date()) {
  const [metars, fc] = await Promise.all([
    fetch(metarUrl(2)).then((r) => (r.ok ? (r.json() as Promise<Metar[]>) : [])).catch(() => [] as Metar[]),
    loadForecast().catch(() => null),
  ]);
  const metar = metars[0];
  const { day: today, hour } = local(now);
  const tomorrow = local(new Date(now.getTime() + 24 * 3600_000)).day;

  // Tageslicht laut Open-Meteo (Fallback: 7–19 Uhr)
  const d = fc?.daily.time.indexOf(today) ?? -1;
  const sunrise = d >= 0 ? fc!.daily.sunrise[d].slice(11, 16) : "07:00";
  const sunset = d >= 0 ? fc!.daily.sunset[d].slice(11, 16) : "19:00";
  const nowTime = local(now).time;
  const daylight = nowTime >= sunrise && nowTime <= sunset;

  const metarFresh = metar && now.getTime() - metar.obsTime * 1000 < 75 * 60_000;
  const forecastSlot = hour === 18 && now.getUTCMinutes() < 30;

  let cursor: string | undefined;
  do {
    const page = await env.SUBSCRIPTIONS.list({ prefix: "sub:", cursor });
    cursor = page.list_complete ? undefined : page.cursor;

    for (const { name } of page.keys) {
      const sub = await env.SUBSCRIPTIONS.get<Subscription>(name, "json");
      if (!sub) continue;
      const p = sub.prefs;
      let msg: Subscription["message"] = null;
      let changed = false;

      // 1. Aktueller Wind
      const throttled = p.freq === 1 ? sub.lastSentDay === today : now.getTime() - sub.lastSent < p.freq * 3600_000 - 5 * 60_000;
      if (metarFresh && isGreen(metar.wdir) && metar.wspd >= p.minWind && (!p.daytime || daylight) && !throttled) {
        msg = {
          title: "Rheinmünster Wind",
          body: `${wind(metar.wspd, p.unit)}${metar.wgst ? `, Böen ${wind(metar.wgst, p.unit)}` : ""} aus ${deg(metar.wdir)} · METAR ${local(new Date(metar.obsTime * 1000)).time} Uhr`,
        };
        sub.lastSent = now.getTime();
        sub.lastSentDay = today;
        changed = true;
      }
      // 2. Vorhersage für morgen (einmal am Abend)
      else if (forecastSlot && p.forecastAlarm && fc && sub.lastForecastDay !== today) {
        const w = tomorrowWindow(fc, tomorrow, p.minWind);
        sub.lastForecastDay = today;
        changed = true;
        if (w) {
          msg = {
            title: "Rheinmünster Wind morgen",
            body: `${w.from}–${w.to} Uhr, bis ${wind(w.peak.spd, p.unit)} aus ${deg(w.peak.dir)} (Vorhersage)`,
          };
        }
      }

      if (!changed) continue;
      if (msg) sub.message = msg;
      await env.SUBSCRIPTIONS.put(name, JSON.stringify(sub));
      if (!msg) continue;

      const status = await sendPush(sub.endpoint, env).catch((err) => {
        console.error("Push fehlgeschlagen", err);
        return 0;
      });
      if (status === 404 || status === 410) await env.SUBSCRIPTIONS.delete(name); // Gerät abgemeldet
    }
  } while (cursor);
}

// --- Einstieg --------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(request.url);

    if (request.method === "GET") {
      switch (url.pathname) {
        case "/metar": {
          const hours = Math.min(12, Math.max(1, Number(url.searchParams.get("hours")) || 6));
          return proxy(metarUrl(hours), 60, ctx);
        }
        case "/taf":
          return proxy(`https://aviationweather.gov/api/data/taf?ids=${STATION}&format=json`, 600, ctx);
        case "/config":
          return json({ vapidPublicKey: env.VAPID_PUBLIC_KEY || null });
        case "/message":
          return message(url, env);
      }
    }
    if (request.method === "POST") {
      if (!env.SUBSCRIPTIONS || !env.VAPID_PUBLIC_KEY) return json({ error: "Wind-Alarm ist nicht eingerichtet" }, 503);
      if (url.pathname === "/subscribe") return subscribe(request, env);
      if (url.pathname === "/unsubscribe") return unsubscribe(request, env);
    }
    return json({ error: "Nicht gefunden" }, 404);
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (!env.SUBSCRIPTIONS || !env.VAPID_PRIVATE_KEY) return;
    ctx.waitUntil(runAlarm(env));
  },
} satisfies ExportedHandler<Env>;

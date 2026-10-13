import { API_BASE, SPOT } from "./config";
import { localHour, TZ } from "./units";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// --- METAR / TAF (aviationweather.gov über den Worker) ----------------------

export type Cloud = { cover: string; base: number | null };

export type Metar = {
  obsTime: number; // Unix-Sekunden
  temp: number;
  dewp: number;
  wdir: number | "VRB" | null;
  wspd: number;
  wgst?: number | null;
  visib: number | string;
  altim: number;
  rawOb: string;
  cover?: string;
  clouds: Cloud[];
  fltCat?: string;
  wxString?: string | null;
};

export type TafPeriod = {
  timeFrom: number;
  timeTo: number;
  fcstChange: string | null;
  probability: number | null;
  wdir: number | "VRB" | null;
  wspd: number | null;
  wgst: number | null;
  visib: number | string | null;
  wxString: string | null;
  clouds: Cloud[];
};

export type Taf = { rawTAF: string; issueTime: string; fcsts: TafPeriod[] };

/** METARs der letzten Stunden, neueste zuerst. */
export const fetchMetar = (hours = 6) => getJson<Metar[]>(`${API_BASE}/metar?hours=${hours}`);

export const fetchTaf = async () => (await getJson<Taf[]>(`${API_BASE}/taf`))[0] ?? null;

// --- Wind-Vorhersage (Open-Meteo, DWD ICON) ---------------------------------

export type ForecastHour = { time: Date; hour: number; speed: number; gust: number; dir: number };
export type Forecast = {
  days: { date: Date; hours: ForecastHour[]; sunrise: Date; sunset: Date }[];
};

type OpenMeteo = {
  hourly: { time: number[]; wind_speed_10m: number[]; wind_gusts_10m: number[]; wind_direction_10m: number[] };
  daily: { time: number[]; sunrise: number[]; sunset: number[] };
};

export async function fetchForecast(): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(SPOT.lat),
    longitude: String(SPOT.lon),
    hourly: "wind_speed_10m,wind_gusts_10m,wind_direction_10m",
    daily: "sunrise,sunset",
    wind_speed_unit: "kn",
    models: "icon_seamless",
    forecast_days: "3",
    timezone: TZ,
    timeformat: "unixtime",
  });
  const data = await getJson<OpenMeteo>(`https://api.open-meteo.com/v1/forecast?${params}`);
  return {
    // daily.time ist Mitternacht Ortszeit als Unix-Zeit; Stunden bis zum nächsten Tag gehören dazu
    days: data.daily.time.map((start, d) => {
      const end = data.daily.time[d + 1] ?? start + 24 * 3600;
      return {
        date: new Date(start * 1000),
        sunrise: new Date(data.daily.sunrise[d] * 1000),
        sunset: new Date(data.daily.sunset[d] * 1000),
        hours: data.hourly.time
          .map((t, i) => ({
            time: new Date(t * 1000),
            hour: localHour(new Date(t * 1000)),
            speed: data.hourly.wind_speed_10m[i],
            gust: data.hourly.wind_gusts_10m[i],
            dir: data.hourly.wind_direction_10m[i],
          }))
          .filter((_, i) => data.hourly.time[i] >= start && data.hourly.time[i] < end),
      };
    }),
  };
}

// --- Rhein: Pegelonline (Iffezheim) ------------------------------------------

type PegelStation = {
  timeseries: {
    shortname: string;
    currentMeasurement?: { timestamp: string; value: number; stateMnwMhw?: string; stateNswHsw?: string };
  }[];
};

export type River = {
  level: number;
  levelYesterday: number | null;
  levelTime: Date;
  flow: number | null;
  flowTime: Date | null;
  floodState: "high" | "low" | "normal" | "unknown";
};

const PEGEL = "https://www.pegelonline.wsv.de/webservices/rest-api/v2/stations/IFFEZHEIM";

export async function fetchRiver(): Promise<River> {
  const [station, history] = await Promise.all([
    getJson<PegelStation>(`${PEGEL}.json?includeTimeseries=true&includeCurrentMeasurement=true`),
    getJson<{ timestamp: string; value: number }[]>(`${PEGEL}/W/measurements.json?start=P1D`).catch(() => []),
  ]);
  const w = station.timeseries.find((t) => t.shortname === "W")?.currentMeasurement;
  const q = station.timeseries.find((t) => t.shortname === "Q")?.currentMeasurement;
  if (!w) throw new Error("Kein Pegelwert");

  const states = [w.stateNswHsw, w.stateMnwMhw];
  const floodState = states.includes("high") ? "high" : states.includes("low") ? "low" : w.stateMnwMhw === "normal" ? "normal" : "unknown";

  return {
    level: w.value,
    levelYesterday: history.length ? history[0].value : null,
    levelTime: new Date(w.timestamp),
    flow: q?.value ?? null,
    flowTime: q ? new Date(q.timestamp) : null,
    floodState,
  };
}

/**
 * Grobe Schätzung der Oberflächenströmung aus dem Abfluss:
 * Querschnitt ca. 300 m × 6 m, Oberfläche ca. 1,3 × mittlere Geschwindigkeit.
 */
export const estimateSurfaceSpeedKmh = (flowM3s: number) => (flowM3s / (300 * 6)) * 1.3 * 3.6;

// --- Wassertemperatur (LUBW) ---------------------------------------------------

export type WaterTemp = { value: string; measured: string };

export async function fetchWaterTemp(): Promise<WaterTemp> {
  const data = await getJson<{ tempchart: { chartSubtitle: { text: string } } }>(
    "https://lupo-cloud.de/niz-app/quality-station?id=2838&component=guete-temp&from=1d-ago",
  );
  const raw = data.tempchart.chartSubtitle.text;
  const match = raw.match(/([\d,]+)\s*°C/);
  if (!match) throw new Error("Keine Temperatur gefunden");
  return {
    value: `${match[1]} °C`,
    measured: raw.replace(/.*letzter Wert\s*/i, "").replace(match[0], "").trim(),
  };
}

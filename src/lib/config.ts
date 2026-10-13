/** Basis-URL des Cloudflare Workers (METAR/TAF-Proxy und Wind-Alarm). */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? "https://silent-night-c341.tristanteufel.workers.dev").replace(/\/$/, "");

/** Position für die Wind-Vorhersage (Rhein bei Rheinmünster). */
export const SPOT = { lat: 48.78, lon: 8.05 };

/** Windrichtungen, die am Spot grün markiert werden (Herkunftsrichtung in Grad). */
export const GREEN_SECTOR = { from: 20, to: 80 };

export function isGreen(dir: number | null | undefined): dir is number {
  return typeof dir === "number" && dir >= GREEN_SECTOR.from && dir <= GREEN_SECTOR.to;
}

/** Wie oft alle Daten neu geladen werden. */
export const REFRESH_MS = 5 * 60 * 1000;

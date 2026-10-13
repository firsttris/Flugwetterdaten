export type WindUnit = "kn" | "kmh" | "bft";

const BEAUFORT_KN = [1, 4, 7, 11, 17, 22, 28, 34, 41, 48, 56, 64];

export function convertWind(kn: number, unit: WindUnit): number {
  if (unit === "kmh") return Math.round(kn * 1.852);
  if (unit === "bft") return BEAUFORT_KN.filter((t) => kn >= t).length;
  return Math.round(kn);
}

export const UNIT_SHORT: Record<WindUnit, string> = { kn: "kn", kmh: "km/h", bft: "Bft" };
export const UNIT_LONG: Record<WindUnit, string> = { kn: "Knoten", kmh: "km/h", bft: "Beaufort" };

const CARDINALS = ["N", "NNO", "NO", "ONO", "O", "OSO", "SO", "SSO", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function cardinal(deg: number): string {
  return CARDINALS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

export const pad3 = (deg: number) => String(Math.round(deg)).padStart(3, "0");

/** Alle Zeiten in deutscher Ortszeit, egal wo das Gerät steht. */
export const TZ = "Europe/Berlin";

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

export function localHour(date: Date): number {
  return Number(date.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ })) % 24;
}

export function minutesAgo(date: Date, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - date.getTime()) / 60000));
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min`;
  const h = Math.floor(min / 60);
  return `vor ${h} Std${min % 60 ? ` ${min % 60} Min` : ""}`;
}

export const formatNumber = (n: number, digits = 0) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });

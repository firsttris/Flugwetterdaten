import { useCallback, useEffect, useState } from "react";
import type { WindUnit } from "@/lib/units";

export type Settings = {
  alarm: boolean;
  minWind: number; // Knoten
  daytime: boolean;
  freq: "1" | "3"; // 1 = höchstens 1× am Tag, 3 = höchstens alle 3 Stunden
  forecastAlarm: boolean;
  unit: WindUnit;
  theme: "system" | "light" | "dark";
  showFlightWeather: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  alarm: false,
  minWind: 12,
  daytime: true,
  freq: "1",
  forecastAlarm: false,
  unit: "kn",
  theme: "system",
  showFlightWeather: true,
};

const KEY = "rm-settings";

function load(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* privater Modus o. ä. */
      }
      return next;
    });
  }, []);

  // Design anwenden und bei „System“ auf Änderungen des Geräts reagieren
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        settings.theme === "dark" || (settings.theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  return [settings, update] as const;
}

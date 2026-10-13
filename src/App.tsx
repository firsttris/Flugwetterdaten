import { useEffect, useRef } from "react";
import { FlightWeather } from "@/components/flight-weather";
import { Forecast } from "@/components/forecast";
import { LinksCard } from "@/components/links-card";
import { RiverStats } from "@/components/river-stats";
import { SettingsSheet } from "@/components/settings-sheet";
import { WindNow } from "@/components/wind-now";
import { useNow, usePolling } from "@/hooks/use-polling";
import { useSettings } from "@/hooks/use-settings";
import { fetchForecast, fetchMetar, fetchRiver, fetchTaf, fetchWaterTemp } from "@/lib/api";
import { syncPushPrefs } from "@/lib/push";
import { convertWind, formatTime, minutesAgo, pad3, UNIT_SHORT } from "@/lib/units";
import { cn } from "@/lib/utils";

const STALE_MIN = 90;

export default function App() {
  const [settings, update] = useSettings();
  const now = useNow();
  const metar = usePolling(() => fetchMetar(6));
  const taf = usePolling(fetchTaf, 30 * 60 * 1000);
  const forecast = usePolling(fetchForecast, 30 * 60 * 1000);
  const river = usePolling(fetchRiver);
  const temp = usePolling(fetchWaterTemp, 30 * 60 * 1000);

  const latest = metar.data?.[0] ?? null;
  const obs = latest ? new Date(latest.obsTime * 1000) : null;
  const stale = obs ? now - obs.getTime() > STALE_MIN * 60_000 : false;
  const u = UNIT_SHORT[settings.unit];

  // Geänderte Alarm-Einstellungen an den Worker schicken (kurz gesammelt)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!settings.alarm) return;
    const id = setTimeout(() => syncPushPrefs(settings).catch(console.error), 800);
    return () => clearTimeout(id);
  }, [settings]);

  const testMessage =
    latest && typeof latest.wdir === "number"
      ? `${convertWind(latest.wspd, settings.unit)} ${u}${latest.wgst ? `, Böen ${convertWind(latest.wgst, settings.unit)} ${u}` : ""} aus ${pad3(latest.wdir)}° · Testnachricht`
      : "So sieht der Wind-Alarm aus · Testnachricht";

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 pt-5 pb-12">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-balance">NATO-Rampe Rheinmünster</h1>
          <p className="text-[13px] text-muted-foreground">Wind &amp; Wasser am Rhein · METAR EDSB Baden-Airpark</p>
          {obs && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              <i className={cn("size-[7px] rounded-full", stale ? "bg-muted-foreground" : "bg-good shadow-[0_0_0_3px_var(--good-soft)]")} />
              {stale ? "Veraltet · " : "Stand "}
              {formatTime(obs)} · {minutesAgo(obs, now)}
            </span>
          )}
        </div>
        <SettingsSheet settings={settings} update={update} testMessage={testMessage} />
      </header>

      <WindNow metars={metar.data} error={metar.error} unit={settings.unit} />
      <Forecast data={forecast.data} error={forecast.error} unit={settings.unit} now={now} />
      <RiverStats river={river} temp={temp} />
      {settings.showFlightWeather && (
        <FlightWeather metar={latest} taf={taf.data} error={metar.error} sun={forecast.data?.days[0]} unit={settings.unit} />
      )}
      <LinksCard />

      <footer className="text-center text-xs text-muted-foreground">
        Daten: aviationweather.gov · Open-Meteo · LUBW · Pegelonline WSV ·{" "}
        <a className="underline" href="https://github.com/firsttris/Flugwetterdaten" target="_blank" rel="noopener noreferrer">
          Quellcode auf GitHub
        </a>
      </footer>
    </div>
  );
}

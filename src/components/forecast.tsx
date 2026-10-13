import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DirArrow } from "@/components/compass";
import { ErrorNote, Skeleton } from "@/components/status";
import type { Forecast as ForecastData } from "@/lib/api";
import { isGreen } from "@/lib/config";
import { convertWind, formatTime, pad3, TZ, UNIT_LONG, UNIT_SHORT, type WindUnit } from "@/lib/units";
import { cn } from "@/lib/utils";

const FIRST_HOUR = 6;
const LAST_HOUR = 21;
const BAR_MAX = 30; // kn, Balkenhöhe darüber wird gekappt
const BAR_PX = 48;

function dayLabel(date: Date, index: number) {
  const name = index === 0 ? "Heute" : index === 1 ? "Morgen" : date.toLocaleDateString("de-DE", { weekday: "short", timeZone: TZ });
  return { name, date: date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: TZ }) };
}

export function Forecast({ data, error, unit, now }: { data: ForecastData | null; error: Error | null; unit: WindUnit; now: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vorhersage 3 Tage</CardTitle>
        <CardDescription>
          {FIRST_HOUR}–{LAST_HOUR} Uhr · {UNIT_LONG[unit]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5">
        {data ? (
          data.days.map((day, d) => {
            const label = dayLabel(day.date, d);
            const hours = day.hours.filter((h) => h.hour >= FIRST_HOUR && h.hour <= LAST_HOUR);
            return (
              <div key={day.date.getTime()} className="grid grid-cols-[44px_minmax(0,1fr)] items-end gap-2">
                <div className="pb-[18px] text-xs leading-tight font-semibold">
                  {label.name}
                  <span className="block font-normal text-muted-foreground">{label.date}</span>
                </div>
                <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}>
                  {hours.map((h) => {
                    const green = isGreen(h.dir);
                    const past = h.time.getTime() + 3600_000 < now;
                    return (
                      <div
                        key={h.time.toISOString()}
                        className={cn("flex min-w-0 flex-col items-center gap-[3px]", past && "opacity-40")}
                        title={`${formatTime(h.time)} · ${convertWind(h.speed, unit)} ${UNIT_SHORT[unit]}, Böen ${convertWind(h.gust, unit)} · ${pad3(h.dir)}°`}
                      >
                        <DirArrow dir={h.dir} />
                        <span className={cn("text-[10px] leading-none tabular-nums text-muted-foreground", green && "font-semibold text-good-foreground")}>
                          {convertWind(h.speed, unit)}
                        </span>
                        <div className="relative flex w-full max-w-[18px] items-end" style={{ height: BAR_PX }}>
                          <b
                            className={cn("block w-full rounded-t-[3px] rounded-b-[1px]", green ? "bg-good" : "bg-bar")}
                            style={{ height: (Math.min(h.speed, BAR_MAX) / BAR_MAX) * BAR_PX }}
                          />
                          <i
                            className="absolute right-[15%] left-[15%] h-0.5 rounded-sm bg-muted-foreground opacity-60"
                            style={{ bottom: (Math.min(h.gust, BAR_MAX) / BAR_MAX) * BAR_PX }}
                          />
                        </div>
                        <span className="h-3 text-[10px] leading-3 text-muted-foreground">
                          {h.hour % 3 === 0 ? h.hour : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : error ? (
          <ErrorNote what="Die Vorhersage" />
        ) : (
          <Skeleton className="h-56 w-full" />
        )}
        <p className="text-xs text-muted-foreground">DWD ICON über Open-Meteo · Balken: Mittelwind, Strich: Böen</p>
      </CardContent>
    </Card>
  );
}

import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, ArrowUp, Droplet, Thermometer, Waves } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/status";
import { estimateSurfaceSpeedKmh, type River, type WaterTemp } from "@/lib/api";
import { formatDateTime, formatNumber } from "@/lib/units";

type Polled<T> = { data: T | null; error: Error | null };

const TREND_THRESHOLD_CM = 2;

export function RiverStats({ river, temp }: { river: Polled<River>; temp: Polled<WaterTemp> }) {
  const r = river.data;
  const trend = r?.levelYesterday == null ? null : r.level - r.levelYesterday;

  return (
    <section className="grid grid-cols-2 gap-3">
      <Stat
        title="Wassertemperatur"
        icon={<Thermometer />}
        value={temp.data?.value}
        failed={!!temp.error && !temp.data}
        sub={temp.data && `LUBW · ${temp.data.measured}`}
      />
      <Stat
        title="Pegel Iffezheim"
        icon={<Waves />}
        value={r && `${formatNumber(r.level)} cm`}
        failed={!!river.error && !r}
        sub={
          r && (
            <>
              {trend != null && (
                <Badge variant="water">
                  {trend > TREND_THRESHOLD_CM ? <><ArrowUp />steigend</> : trend < -TREND_THRESHOLD_CM ? <><ArrowDown />fallend</> : "stabil"}
                </Badge>
              )}
              {r.levelYesterday != null && <span>gestern {formatNumber(r.levelYesterday)} cm</span>}
            </>
          )
        }
      />
      <Stat
        title="Strömung"
        icon={<ArrowRight />}
        value={r?.flow != null ? `ca. ${formatNumber(estimateSurfaceSpeedKmh(r.flow), 1)} km/h` : r ? "–" : undefined}
        failed={!!river.error && !r}
        sub={r?.flow != null && `Abfluss ${formatNumber(r.flow)} m³/s · geschätzt`}
      />
      <Stat
        title="Hochwasser"
        icon={<Droplet />}
        value={
          r && (
            <Badge variant={r.floodState === "high" ? "destructive" : r.floodState === "low" ? "water" : "good"} className="text-sm">
              {r.floodState === "high" ? "Hochwasser" : r.floodState === "low" ? "Niedrigwasser" : "Normal"}
            </Badge>
          )
        }
        failed={!!river.error && !r}
        sub={r && `Pegelonline · ${formatDateTime(r.levelTime)}`}
      />
    </section>
  );
}

function Stat({ title, icon, value, sub, failed }: { title: string; icon: ReactNode; value: ReactNode; sub?: ReactNode; failed: boolean }) {
  return (
    <Card className="flex flex-col gap-1 px-4 py-3.5">
      <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        {title}
        {icon}
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">
        {value ?? (failed ? <span className="text-base font-normal text-muted-foreground">nicht verfügbar</span> : <Skeleton className="my-1 h-6 w-24" />)}
      </div>
      {sub && <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

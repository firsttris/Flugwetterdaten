import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "@/components/compass";
import type { Metar } from "@/lib/api";
import { isGreen } from "@/lib/config";
import { cardinal, convertWind, formatTime, pad3, UNIT_LONG, UNIT_SHORT, type WindUnit } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ErrorNote, Skeleton } from "@/components/status";

const dirOf = (m: Metar) => (typeof m.wdir === "number" ? m.wdir : null);

export function WindNow({ metars, error, unit }: { metars: Metar[] | null; error: Error | null; unit: WindUnit }) {
  const latest = metars?.[0];
  const u = UNIT_SHORT[unit];
  const dir = latest ? dirOf(latest) : undefined;

  return (
    <Card>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div className="min-w-0">
          <CardTitle className="mb-3.5">Wind jetzt</CardTitle>
          {latest ? (
            <>
              <div className="flex flex-wrap gap-6 tabular-nums">
                <Value label="Wind" value={convertWind(latest.wspd, unit)} unit={u} />
                <Value label="Böen" value={latest.wgst ? convertWind(latest.wgst, unit) : "–"} unit={latest.wgst ? u : ""} />
                <Value
                  label="Richtung"
                  value={typeof dir === "number" ? (latest.wspd === 0 ? "–" : `${pad3(dir)}°`) : "VRB"}
                  unit={typeof dir === "number" ? (latest.wspd === 0 ? "still" : cardinal(dir)) : "wechselnd"}
                  green={isGreen(dir) && latest.wspd > 0}
                />
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                METAR EDSB von {formatTime(new Date(latest.obsTime * 1000))} Uhr
              </p>
            </>
          ) : error ? (
            <ErrorNote what="Winddaten" />
          ) : (
            <Skeleton className="h-16 w-64 max-w-full" />
          )}
        </div>
        <div className="w-[200px] max-w-full justify-self-center">
          <Compass dir={latest && latest.wspd > 0 ? dir : undefined} />
        </div>
      </CardContent>

      <CardHeader className="border-t">
        <CardTitle as="h3">Windverlauf letzte 6 Stunden</CardTitle>
        <CardDescription>METAR alle 30 Min · {UNIT_LONG[unit]}</CardDescription>
      </CardHeader>
      <CardContent>
        {metars && metars.length > 1 ? <WindHistory metars={metars} unit={unit} /> : <Skeleton className="h-[190px] w-full" />}
        <div className="mt-1.5 flex flex-wrap gap-3.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><i className="w-3.5 border-t-2 border-water" />Mittelwind</span>
          <span className="inline-flex items-center gap-1.5"><i className="w-3.5 border-t-2 border-dashed border-muted-foreground" />Böen</span>
          <span>Pfeile: Windrichtung</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Value({ label, value, unit, green }: { label: string; value: string | number; unit: string; green?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-[32px] leading-tight font-semibold tracking-tight", green && "text-good")}>
        {value}
        <small className="ml-1 text-sm font-medium tracking-normal text-muted-foreground">{unit}</small>
      </div>
    </div>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, width] as const;
}

function WindHistory({ metars, unit }: { metars: Metar[]; unit: WindUnit }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  return (
    <div ref={ref}>
      <HistoryChart metars={metars} unit={unit} W={Math.max(width, 280)} />
    </div>
  );
}

function HistoryChart({ metars, unit, W }: { metars: Metar[]; unit: WindUnit; W: number }) {
  const H = 190, L = 26, R = 12, T = 30, B = 24;
  const points = [...metars].reverse();
  const start = points[0].obsTime, end = points[points.length - 1].obsTime;
  const span = Math.max(end - start, 1);
  const max = Math.max(30, ...points.map((m) => m.wgst ?? m.wspd));
  const top = Math.ceil(max / 10) * 10;
  const x = (t: number) => L + ((t - start) / span) * (W - L - R);
  const y = (v: number) => T + (H - T - B) * (1 - v / top);

  const line = points.map((m, i) => `${i ? "L" : "M"}${x(m.obsTime)} ${y(m.wspd)}`).join("");
  let gustPath = "";
  let pen = false;
  for (const m of points) {
    if (!m.wgst) { pen = false; continue; }
    gustPath += `${pen ? "L" : "M"}${x(m.obsTime)} ${y(m.wgst)}`;
    pen = true;
  }
  const last = points[points.length - 1];
  const ticks = Array.from({ length: top / 10 + 1 }, (_, i) => i * 10);
  // Volle Stunden als Beschriftung (auf schmalen Bildschirmen jede zweite)
  const step = W < 480 ? 7200 : 3600;
  const hours: number[] = [];
  for (let t = Math.ceil(start / step) * step; t <= end; t += step) hours.push(t);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block h-auto w-full" role="img" aria-label="Windverlauf der letzten Stunden">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted-foreground)">{convertWind(v, unit)}</text>
        </g>
      ))}
      <path d={`${line}L${x(last.obsTime)} ${y(0)}L${x(start)} ${y(0)}Z`} fill="var(--water-soft)" />
      <path d={line} fill="none" stroke="var(--water)" strokeWidth="2.5" strokeLinejoin="round" />
      {gustPath && <path d={gustPath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 4" />}
      <circle cx={x(last.obsTime)} cy={y(last.wspd)} r="4.5" fill="var(--water)" stroke="var(--card)" strokeWidth="2" />
      {points.map((m, i) =>
        (points.length - 1 - i) % (W < 480 ? 2 : 1) !== 0 ? null : typeof m.wdir === "number" && m.wspd > 0 ? (
          <g key={m.obsTime} transform={`translate(${x(m.obsTime)} 12) rotate(${m.wdir + 180})`}>
            <path d="M0 -7L0 7M-4 3L0 7L4 3" stroke={isGreen(m.wdir) ? "var(--good)" : "var(--muted-foreground)"} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : (
          <text key={m.obsTime} x={x(m.obsTime)} y="16" textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">·</text>
        ),
      )}
      {hours.map((t) => (
        <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--muted-foreground)">
          {formatTime(new Date(t * 1000))}
        </text>
      ))}
    </svg>
  );
}

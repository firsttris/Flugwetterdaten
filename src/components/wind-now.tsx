import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "@/components/compass";
import { WindStreaks } from "@/components/wind-streaks";
import { useCountUp } from "@/hooks/use-motion";
import type { Metar } from "@/lib/api";
import { isGreen } from "@/lib/config";
import { cardinal, convertWind, formatTime, pad3, UNIT_LONG, UNIT_SHORT, type WindUnit } from "@/lib/units";
import { cn } from "@/lib/utils";
import { ErrorNote, Skeleton } from "@/components/status";

const dirOf = (m: Metar) => (typeof m.wdir === "number" ? m.wdir : null);
const RANGE_MAX = 35; // kn, rechtes Ende des Balkens Wind bis Böen

/** Schwankung der Richtung in der letzten Stunde, als Fächer um die aktuelle Richtung. */
function spreadOf(metars: Metar[], dir: number): [number, number] {
  const hourAgo = metars[0].obsTime - 65 * 60;
  const rel = metars
    .filter((m) => m.obsTime >= hourAgo && typeof m.wdir === "number" && m.wspd > 0)
    .map((m) => ((((m.wdir as number) - dir) % 360) + 540) % 360 - 180);
  return [dir + Math.min(-5, ...rel) - 2, dir + Math.max(5, ...rel) + 2];
}

export function WindNow({ metars, error, unit }: { metars: Metar[] | null; error: Error | null; unit: WindUnit }) {
  const latest = metars?.[0];
  const calm = !latest || latest.wspd === 0 || latest.wdir === "VRB" || latest.wdir === null;
  const dir = latest && !calm ? dirOf(latest) : latest ? null : undefined;
  const lastDir = useRef(45);
  if (typeof dir === "number") lastDir.current = dir;

  return (
    <Card className="overflow-hidden">
      <div className="relative grid items-center gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        {latest && <WindStreaks dir={lastDir.current} speed={latest.wspd} calm={calm} />}
        <div className="relative min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground tabular-nums">
            <LiveDot />
            Wind jetzt{latest && ` · METAR EDSB ${formatTime(new Date(latest.obsTime * 1000))}`}
          </div>
          {latest ? (
            <WindFigures metar={latest} unit={unit} dir={dir ?? null} />
          ) : error ? (
            <div className="mt-3"><ErrorNote what="Winddaten" /></div>
          ) : (
            <>
              <Skeleton className="mt-3 h-16 w-40" />
              <Skeleton className="mt-3 h-5 w-56 max-w-full" />
              <Skeleton className="mt-6 h-1.5 w-full max-w-80" />
            </>
          )}
        </div>
        <div className="relative w-[220px] max-w-full justify-self-center">
          <Compass dir={dir} spread={metars && typeof dir === "number" ? spreadOf(metars, dir) : null} />
        </div>
      </div>

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

export function LiveDot({ stale }: { stale?: boolean }) {
  return (
    <span className={cn("relative size-[7px] shrink-0 rounded-full", stale ? "bg-muted-foreground" : "bg-good")}>
      {!stale && <span className="absolute inset-0 animate-live-ping rounded-full bg-good" />}
    </span>
  );
}

function WindFigures({ metar, unit, dir }: { metar: Metar; unit: WindUnit; dir: number | null }) {
  const u = UNIT_SHORT[unit];
  const speed = useCountUp(convertWind(metar.wspd, unit));
  const gustValue = metar.wgst ? convertWind(metar.wgst, unit) : 0;
  const gust = useCountUp(gustValue);
  const pct = (kn: number) => Math.min(100, (kn / RANGE_MAX) * 100);
  const ease = "transition-[left,width] duration-900 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none";

  return (
    <>
      <div className="mt-1.5 flex items-baseline gap-1.5 leading-[.95] tabular-nums">
        <span className="text-[72px] font-semibold tracking-[-0.055em]">{speed}</span>
        <span className="text-lg font-medium text-muted-foreground">{u}</span>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] text-muted-foreground tabular-nums">
        <span>
          Böen <b className="font-semibold text-foreground">{metar.wgst ? gust : "–"}</b>
          {metar.wgst ? <span className="text-[13px]"> {u}</span> : null}
        </span>
        <span className="size-[3px] rounded-full bg-border" />
        {dir !== null ? (
          <span>
            aus{" "}
            <b className={cn("font-semibold text-foreground transition-colors duration-500", isGreen(dir) && "text-good")}>{pad3(dir)}°</b>{" "}
            {cardinal(dir)}
          </span>
        ) : (
          <span>
            {metar.wspd === 0 ? "windstill" : <>aus <b className="font-semibold text-foreground">wechselnden</b> Richtungen</>}
          </span>
        )}
      </div>
      <div className="mt-5 max-w-80" aria-hidden="true">
        <div className="relative h-1.5 rounded-full bg-muted">
          <div
            className={cn("absolute inset-y-0 rounded-full bg-linear-to-r from-water to-water-soft", ease)}
            style={{ left: `${pct(metar.wspd)}%`, width: `${metar.wgst ? pct(metar.wgst) - pct(metar.wspd) : 0}%` }}
          />
          <div
            className={cn("absolute top-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full border-2 border-water bg-card shadow-sm", ease)}
            style={{ left: `${pct(metar.wspd)}%` }}
          />
        </div>
        <div className="relative mt-1.5 h-3.5 text-[11px] text-muted-foreground tabular-nums">
          {[0, 10, 20].map((v) => (
            <span key={v} className={cn("absolute", v && "-translate-x-1/2")} style={{ left: `${pct(v)}%` }}>
              {convertWind(v, unit)}
            </span>
          ))}
          <span className="absolute right-0">
            {convertWind(30, unit)} {u}
          </span>
        </div>
      </div>
    </>
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
  // Nur beim ersten Anzeigen einzeichnen, nicht bei jedem Neuladen
  const [animate] = useState(true);
  return (
    <div ref={ref}>
      <HistoryChart metars={metars} unit={unit} W={Math.max(width, 280)} animate={animate} />
    </div>
  );
}

function HistoryChart({ metars, unit, W, animate }: { metars: Metar[]; unit: WindUnit; W: number; animate: boolean }) {
  const lineRef = useRef<SVGPathElement>(null);
  const drawn = useRef(false);
  useLayoutEffect(() => {
    const el = lineRef.current;
    if (!el || !animate || drawn.current) return;
    drawn.current = true;
    const len = el.getTotalLength();
    el.style.strokeDasharray = `${len}`;
    el.style.setProperty("--len", `${len}`);
    el.classList.add("animate-draw");
    const done = () => {
      el.style.strokeDasharray = "";
      el.classList.remove("animate-draw");
    };
    el.addEventListener("animationend", done, { once: true });
  }, [animate]);

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
      <path className="animate-fade-late" d={`${line}L${x(last.obsTime)} ${y(0)}L${x(start)} ${y(0)}Z`} fill="var(--water-soft)" />
      <path ref={lineRef} d={line} fill="none" stroke="var(--water)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {gustPath && <path className="animate-fade-late" d={gustPath} fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" strokeDasharray="4 4" />}
      <circle cx={x(last.obsTime)} cy={y(last.wspd)} r="4.5" fill="var(--water)" className="animate-endpoint-ping" style={{ transformOrigin: `${x(last.obsTime)}px ${y(last.wspd)}px`, transformBox: "view-box" }} />
      <circle className="animate-fade-late" cx={x(last.obsTime)} cy={y(last.wspd)} r="4.5" fill="var(--water)" stroke="var(--card)" strokeWidth="2" />
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

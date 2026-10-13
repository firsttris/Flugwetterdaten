import { useId, useLayoutEffect, useRef, useState } from "react";
import { GREEN_SECTOR, isGreen } from "@/lib/config";
import { cn } from "@/lib/utils";

const C = 100;
const point = (r: number, deg: number): [number, number] => [
  C + r * Math.sin((deg * Math.PI) / 180),
  C - r * Math.cos((deg * Math.PI) / 180),
];

function arc(r0: number, r1: number, a0: number, a1: number) {
  const span = (a1 - a0 + 360) % 360;
  const large = span > 180 ? 1 : 0;
  const [x0, y0] = point(r1, a0);
  const [x1, y1] = point(r1, a0 + span);
  const [x2, y2] = point(r0, a0 + span);
  const [x3, y3] = point(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`;
}

const TICKS = Array.from({ length: 72 }, (_, i) => i * 5);

/**
 * Windkompass im Stil eines Instruments.
 * `dir`: Herkunftsrichtung (die Nadel zeigt, wohin der Wind weht), `null` = umlaufend (VRB),
 * `undefined` = nur Skala. `spread`: Schwankung der Richtung als [von, bis] in Grad.
 */
export function Compass({ dir, spread, className }: { dir?: number | null; spread?: [number, number] | null; className?: string }) {
  const id = useId().replace(/:/g, "");
  const green = isGreen(dir);
  const color = green ? "var(--good)" : "var(--foreground)";
  const angle = useNeedleAngle(typeof dir === "number" ? dir : null);
  const [s0, s1] = point(80, GREEN_SECTOR.from), [e0, e1] = point(80, GREEN_SECTOR.to);

  return (
    <svg
      viewBox="0 0 200 200"
      className={cn("block h-auto w-full", className)}
      role="img"
      aria-label={typeof dir === "number" ? `Wind aus ${Math.round(dir)} Grad` : dir === null ? "Wind aus wechselnden Richtungen" : "Windkompass"}
    >
      <defs>
        <radialGradient id={`${id}face`} cx="50%" cy="40%" r="65%">
          <stop offset="0" stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--muted)" />
        </radialGradient>
        <linearGradient id={`${id}sec`} gradientUnits="userSpaceOnUse" x1={s0} y1={s1} x2={e0} y2={e1}>
          <stop offset="0" stopColor="var(--good)" stopOpacity=".55" />
          <stop offset=".5" stopColor="var(--good)" />
          <stop offset="1" stopColor="var(--good)" stopOpacity=".55" />
        </linearGradient>
        <filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <filter id={`${id}shadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity=".25" />
        </filter>
      </defs>

      <circle cx={C} cy={C} r="94" fill={`url(#${id}face)`} stroke="var(--border)" />
      <circle cx={C} cy={C} r="66" fill="none" stroke="var(--border)" strokeDasharray="1 3" />

      <path d={arc(74, 82, GREEN_SECTOR.from, GREEN_SECTOR.to)} fill="var(--good)" opacity=".45" filter={`url(#${id}glow)`} />
      <path d={arc(74, 82, GREEN_SECTOR.from, GREEN_SECTOR.to)} fill={`url(#${id}sec)`} />

      {TICKS.map((a) => {
        const major = a % 30 === 0, cardinal = a % 90 === 0;
        const [x0, y0] = point(cardinal ? 84 : major ? 85 : 87.5, a);
        const [x1, y1] = point(91, a);
        return (
          <line
            key={a}
            x1={x0} y1={y0} x2={x1} y2={y1}
            stroke={major ? "var(--foreground)" : "var(--muted-foreground)"}
            strokeOpacity={major ? 0.7 : 0.35}
            strokeWidth={cardinal ? 1.6 : 1}
          />
        );
      })}
      {([["N", 0], ["O", 90], ["S", 180], ["W", 270]] as const).map(([t, a]) => {
        const [x, y] = point(56, a);
        return (
          <text key={t} x={x} y={y + 4.5} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--muted-foreground)">
            {t}
          </text>
        );
      })}

      {typeof dir === "number" && spread && (
        <path
          d={`M${C} ${C}L${point(72, spread[0]).join(" ")}A72 72 0 0 1 ${point(72, spread[1]).join(" ")}Z`}
          fill={color}
          opacity=".09"
          className="transition-opacity duration-500"
        />
      )}

      <text x={C} y={C + 26} textAnchor="middle" fontSize="13" fontWeight="500" fill="var(--muted-foreground)" opacity={dir === null ? 1 : 0} className="transition-opacity duration-300">
        VRB
      </text>

      {/* Nadel für Wind aus Norden, per CSS gedreht. Kreis = Herkunft, Spitze = wohin der Wind weht */}
      <g
        filter={`url(#${id}shadow)`}
        opacity={typeof dir === "number" ? 1 : 0}
        style={{
          transformOrigin: "100px 100px",
          transform: `rotate(${angle.value}deg)`,
          transition: angle.animate ? "transform 1.1s cubic-bezier(.3,1.25,.5,1), opacity .4s" : "none",
        }}
        className="motion-reduce:transition-none!"
      >
        <path d="M100 30 L103 100 L100 132 L97 100 Z" fill={color} className="transition-[fill] duration-500" />
        <path d="M100 140 L92 123 L100 128 L108 123 Z" fill={color} className="transition-[fill] duration-500" />
        <circle cx="100" cy="30" r="5" fill={color} className="transition-[fill] duration-500" />
      </g>

      <circle cx={C} cy={C} r="7" fill="var(--card)" stroke="var(--border)" />
      <circle cx={C} cy={C} r="2.5" fill="var(--muted-foreground)" />
    </svg>
  );
}

/**
 * Drehwinkel der Nadel: dreht immer auf dem kürzesten Weg und schwingt beim
 * ersten Wert aus einer Vierteldrehung ein.
 */
function useNeedleAngle(dir: number | null) {
  const current = useRef<number | null>(null);
  const [state, setState] = useState({ value: 0, animate: false });

  useLayoutEffect(() => {
    if (dir === null) return;
    if (current.current === null) {
      current.current = dir - 100;
      setState({ value: current.current, animate: false });
      const frame = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          current.current = dir;
          setState({ value: dir, animate: true });
        }),
      );
      return () => cancelAnimationFrame(frame);
    }
    const delta = ((((dir - current.current) % 360) + 540) % 360) - 180;
    current.current += delta;
    setState({ value: current.current, animate: true });
  }, [dir]);

  return state;
}

/** Kleiner Richtungspfeil für Diagramme (zeigt, wohin der Wind weht). */
export function DirArrow({ dir, className }: { dir: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-3", className)} aria-hidden="true">
      <path
        transform={`rotate(${dir + 180} 12 12)`}
        d="M12 3V21M7 16L12 21L17 16"
        stroke={isGreen(dir) ? "var(--good)" : "var(--muted-foreground)"}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

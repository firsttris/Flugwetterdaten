import { GREEN_SECTOR, isGreen } from "@/lib/config";
import { cn } from "@/lib/utils";

const point = (r: number, deg: number, cx = 100, cy = 100): [number, number] => [
  cx + r * Math.sin((deg * Math.PI) / 180),
  cy - r * Math.cos((deg * Math.PI) / 180),
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

/**
 * Windkompass. `dir` ist die Herkunftsrichtung; der Pfeil zeigt, wohin der Wind weht.
 * `dir === null` bedeutet umlaufender Wind (VRB), `undefined` zeigt nur die Skala.
 */
export function Compass({ dir, className }: { dir?: number | null; className?: string }) {
  const green = isGreen(dir);
  const color = green ? "var(--good)" : "var(--foreground)";
  return (
    <svg viewBox="0 0 200 200" className={cn("block h-auto w-full", className)} role="img" aria-label={typeof dir === "number" ? `Wind aus ${Math.round(dir)} Grad` : "Windkompass"}>
      <circle cx="100" cy="100" r="84" fill="var(--muted)" stroke="var(--border)" />
      <path d={arc(70, 84, GREEN_SECTOR.from, GREEN_SECTOR.to)} fill="var(--good)" opacity="0.85" />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => {
        const [x0, y0] = point(64, a);
        const [x1, y1] = point(a % 90 ? 67 : 60, a);
        return <line key={a} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--muted-foreground)" strokeWidth="1" />;
      })}
      {([["N", 0], ["O", 90], ["S", 180], ["W", 270]] as const).map(([t, a]) => {
        const [x, y] = point(50, a);
        return (
          <text key={t} x={x} y={y + 4} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--muted-foreground)">
            {t}
          </text>
        );
      })}
      {typeof dir === "number" && <Arrow dir={dir} color={color} />}
      {dir === null && (
        <text x="100" y="105" textAnchor="middle" fontSize="13" fill="var(--muted-foreground)">
          VRB
        </text>
      )}
    </svg>
  );
}

function Arrow({ dir, color }: { dir: number; color: string }) {
  const [x0, y0] = point(78, dir);
  const [x1, y1] = point(30, dir + 180);
  const [l1x, l1y] = point(14, dir + 155, x1, y1);
  const [l2x, l2y] = point(14, dir + 205, x1, y1);
  return (
    <g stroke={color} strokeWidth="3" strokeLinecap="round" fill="none">
      <line x1={x0} y1={y0} x2={x1} y2={y1} />
      <path d={`M${x1} ${y1}L${l1x} ${l1y}M${x1} ${y1}L${l2x} ${l2y}`} />
      <circle cx={x0} cy={y0} r="5" fill={color} stroke="none" />
    </g>
  );
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

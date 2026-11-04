import type * as React from "react";
import { cn } from "@/lib/utils";

/** Durchmesser des Daumens in px (size-4) */
const THUMB = 16;

type SliderProps = Omit<React.ComponentProps<"input">, "type" | "value" | "min" | "max" | "onChange"> & {
  value: number;
  min: number;
  max: number;
  onValueChange: (value: number) => void;
};

/**
 * Schieberegler für einen Wert, aussehend wie der Slider von shadcn/ui. Bedienung und Screenreader
 * übernimmt ein natives `<input type="range">`, unsichtbar über Spur und Daumen gelegt.
 *
 * Ersetzt den Radix-Slider: Dessen Daumen sucht seinen Index in einer Liste, die Radix erst in
 * einem useEffect füllt. React führt anstehende Effekte vor dem nächsten Rendern aus, TanStack Redact
 * rendert nach dem Ref-Callback vorher; der Daumen blieb dort ohne Wert und unsichtbar.
 */
function Slider({ className, value, min, max, onValueChange, ...props }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  // Hält den Daumen an den Enden innerhalb der Spur, wie Radix und der native Regler
  const inBounds = THUMB / 2 - (percent / 50) * (THUMB / 2);

  return (
    <div data-slot="slider" className={cn("relative flex w-full touch-none items-center select-none", className)}>
      <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <div className="absolute h-full bg-primary" style={{ left: 0, right: `${100 - percent}%` }} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onValueChange(Number(event.currentTarget.value))}
        className="peer absolute inset-x-0 m-0 h-4 w-full cursor-pointer appearance-none opacity-0 [&::-moz-range-thumb]:size-4 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none"
        {...props}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute block size-4 shrink-0 -translate-x-1/2 rounded-full border border-primary bg-background shadow-sm transition-[color,box-shadow] peer-hover:ring-4 peer-hover:ring-ring/50 peer-focus-visible:ring-4 peer-focus-visible:ring-ring/50"
        style={{ left: `calc(${percent}% + ${inBounds}px)` }}
      />
    </div>
  );
}

export { Slider };

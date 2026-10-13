import { useEffect, useRef, useState } from "react";

const query = "(prefers-reduced-motion: reduce)";

/** true, wenn das Gerät „Bewegung reduzieren“ eingeschaltet hat. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const media = matchMedia(query);
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Zählt beim Wechsel des Werts kurz vom alten zum neuen Wert hoch. */
export function useCountUp(value: number, duration = 700): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(reduced ? value : 0);

  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const v = Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3)));
      from.current = v;
      setShown(v);
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, reduced]);

  return shown;
}

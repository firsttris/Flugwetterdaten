import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-motion";

type Particle = { x: number; y: number; len: number; v: number; life: number; max: number };

/**
 * Feine Linien, die in Windrichtung durch den Hintergrund ziehen.
 * `dir` ist die Herkunftsrichtung in Grad, `speed` die Windstärke in Knoten.
 */
export function WindStreaks({ dir, speed, calm }: { dir: number; speed: number; calm: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const target = useRef({ dir, speed, calm });
  target.current = { dir, speed, calm };
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0, h = 0, parts: Particle[] = [];
    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * w,
      y: Math.random() * h,
      len: 18 + Math.random() * 46,
      v: 0.6 + Math.random() * 0.8,
      life: anywhere ? Math.random() : 0,
      max: 1.6 + Math.random() * 2.4,
    });
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: Math.round((w * h) / 5200) }, () => spawn(true));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const state = { angle: target.current.dir, speed: target.current.speed };
    let last = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      // Bei „Bewegung reduzieren“ ein ruhendes Bild, sonst bewegte Linien
      const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = target.current;
      if (reduced) {
        state.angle = t.dir;
        state.speed = t.speed;
      }
      // Richtung und Stärke weich nachführen
      state.angle += ((((t.dir - state.angle) % 360) + 540) % 360 - 180) * Math.min(1, dt * 2.5);
      state.speed += (t.speed - state.speed) * Math.min(1, dt * 2);

      const th = ((state.angle + 180) * Math.PI) / 180;
      const dx = Math.sin(th), dy = -Math.cos(th);
      const pxPerSec = 14 + state.speed * 5.5;
      const rgb = getComputedStyle(canvas).getPropertyValue("--streak").trim();

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      for (const p of parts) {
        p.life += dt / p.max;
        p.x += dx * pxPerSec * p.v * dt;
        p.y += dy * pxPerSec * p.v * dt;
        if (p.life >= 1 || p.x < -80 || p.x > w + 80 || p.y < -80 || p.y > h + 80) Object.assign(p, spawn(false));
        const alpha = (reduced ? 0.6 : Math.sin(Math.PI * Math.min(1, p.life))) * (t.calm ? 0.14 : 0.55);
        const len = p.len * (t.calm ? 0.25 : 0.5 + Math.min(1, state.speed / 20));
        const tx = p.x - dx * len, ty = p.y - dy * len;
        const g = ctx.createLinearGradient(p.x, p.y, tx, ty);
        g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
        g.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    // Ruhendes Bild bei neuen Werten oder geänderter Größe neu zeichnen
    const redraw = reduced ? setInterval(() => requestAnimationFrame(draw), 1000) : 0;
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(redraw);
      observer.disconnect();
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 size-full" />;
}

"use client";

import { useEffect, useRef } from "react";

const PIXEL_SIZE = 4;

// Warm sandy beach palette (day mode from design preview)
const PALETTE = {
  deepOcean: [233, 223, 213] as [number, number, number],
  ocean:     [238, 231, 224] as [number, number, number],
  ripple:    [246, 243, 240] as [number, number, number],
  foam:      [255, 255, 255] as [number, number, number],
  sandDry:   [245, 241, 237] as [number, number, number],
  sandWet:   [233, 223, 213] as [number, number, number],
  bgHex:     "#F5F1ED",
};

// Sparkle colors: coral + near-white
const SPARKLE_COLORS: [number, number, number][] = [
  [255, 111, 97],
  [255, 245, 238],
];

type Foam = { x: number; y: number; width: number };

export default function PixelWave() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let raf: number;
    let resizeRaf = 0;
    let ctx: CanvasRenderingContext2D | null = null;
    let w = 0;
    let h = 0;
    let frame = 0;
    let time = 0;
    let moisture = new Float32Array(0);
    let sparkle = new Int8Array(0);
    let foam: Foam[] = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nw = Math.ceil(rect.width / PIXEL_SIZE);
      const nh = Math.ceil(rect.height / PIXEL_SIZE);
      if (nw === w && nh === h && ctx) return;
      w = nw;
      h = nh;
      canvas.width = w;
      canvas.height = h;
      ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
      moisture = new Float32Array(w * h).fill(0);
      sparkle = new Int8Array(w * h).fill(0);
      foam = [];
      draw();
    };

    const draw = () => {
      if (!ctx || w === 0 || h === 0) return;

      frame += 1;
      time += 0.006;

      // Wave height oscillates between 15% and 35% from top
      const swing = (Math.sin(time) + 1) / 2;
      const waveMin = h * 0.15;
      const waveMax = h * 0.35;
      const waveY = waveMin + swing * (waveMax - waveMin);

      // Spawn foam bubbles occasionally
      if (Math.random() < 0.02) {
        foam.push({
          x: Math.random() * w,
          y: Math.random() * (waveMin - 10),
          width: 4 + Math.random() * 8,
        });
      }
      // Drift foam down, cull past wave
      for (let i = foam.length - 1; i >= 0; i--) {
        foam[i].y += 0.1;
        if (foam[i].y > waveY - 2) foam.splice(i, 1);
      }

      const img = ctx.createImageData(w, h);
      const data = img.data;

      for (let x = 0; x < w; x++) {
        // Per-column wave shape
        const waveSurface = Math.sin(x * 0.1 + frame * 0.03) * 2
                          + Math.cos(x * 0.2 + frame * 0.01) * 1.5;
        const surface = waveY + waveSurface;

        for (let y = 0; y < h; y++) {
          const idx4 = (y * w + x) * 4;
          const idx1 = y * w + x;
          let r: number, g: number, b: number;

          if (y < surface) {
            // Water
            if (sparkle[idx1] !== 0) sparkle[idx1] = 0;
            moisture[idx1] = 1;

            if (surface - y <= 1.5) {
              [r, g, b] = PALETTE.foam;
            } else if (y < h * 0.1 + waveSurface) {
              [r, g, b] = PALETTE.deepOcean;
            } else {
              [r, g, b] = PALETTE.ocean;
            }
          } else {
            // Sand
            if (moisture[idx1] > 0) {
              moisture[idx1] -= 0.006;
              if (moisture[idx1] < 0) moisture[idx1] = 0;
            }
            // Spawn sparkles on freshly wet sand
            if (moisture[idx1] > 0.95 && sparkle[idx1] === 0 && Math.random() < 3e-4) {
              sparkle[idx1] = Math.random() > 0.6 ? 1 : 2;
            }

            const m = moisture[idx1];
            r = PALETTE.sandDry[0] + (PALETTE.sandWet[0] - PALETTE.sandDry[0]) * m;
            g = PALETTE.sandDry[1] + (PALETTE.sandWet[1] - PALETTE.sandDry[1]) * m;
            b = PALETTE.sandDry[2] + (PALETTE.sandWet[2] - PALETTE.sandDry[2]) * m;

            const sp = sparkle[idx1];
            if (sp !== 0) [r, g, b] = SPARKLE_COLORS[sp - 1];
          }

          data[idx4]     = r;
          data[idx4 + 1] = g;
          data[idx4 + 2] = b;
          data[idx4 + 3] = 255;
        }
      }

      // Draw foam particles as ripple-colored streaks
      for (const f of foam) {
        const fy = Math.round(f.y);
        const fx1 = Math.round(f.x);
        const fx2 = Math.round(f.x + f.width);
        if (fy < 0 || fy >= h) continue;
        for (let x = fx1; x < fx2; x++) {
          if (x < 0 || x >= w) continue;
          const waveSurface = Math.sin(x * 0.1 + frame * 0.03) * 2
                            + Math.cos(x * 0.2 + frame * 0.01) * 1.5;
          if (fy < waveY + waveSurface - 2) {
            const idx4 = (fy * w + x) * 4;
            data[idx4]     = PALETTE.ripple[0];
            data[idx4 + 1] = PALETTE.ripple[1];
            data[idx4 + 2] = PALETTE.ripple[2];
          }
        }
      }

      ctx.putImageData(img, 0, 0);
    };

    let lastTime = 0;

    const loop = (now: DOMHighResTimeStamp) => {
      raf = requestAnimationFrame(loop);
      if (now - lastTime < 1000 / 30) return;
      lastTime = now;
      if (!ctx || w === 0 || h === 0) return;
      draw();
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        lastTime = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const ro = new ResizeObserver(() => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; resize(); });
    });
    ro.observe(container);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    raf = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ backgroundColor: PALETTE.bgHex }}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ imageRendering: "pixelated", willChange: "transform" }}
      />
    </div>
  );
}

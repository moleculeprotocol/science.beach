"use client";

import { useEffect, useRef } from "react";
import { createNoise3D } from "@/lib/noise";

const PIXEL_SIZE = 2;
const NOISE_SCALE = 0.004;
const SPEED = 0.012;

const PALETTE: [number, number, number][] = [
  [18, 113, 203],  // #1271CB — deepest
  [0, 121, 235],   // #0079EB
  [34, 147, 255],  // #2293FF
  [8, 214, 255],   // #08D6FF
  [32, 255, 251],  // #20FFFB — highlight
];

export default function PixelWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const noise3D = createNoise3D();
    let raf: number;
    let time = 0;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      canvas.width = Math.ceil(Math.max(1, width) / PIXEL_SIZE);
      canvas.height = Math.ceil(Math.max(1, height) / PIXEL_SIZE);
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) { raf = requestAnimationFrame(draw); return; }

      const imageData = ctx.createImageData(w, h);
      const data = imageData.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const normX = x / w;
          const distFromCenter = Math.abs(normX - 0.5);

          let activity = 0;
          if (distFromCenter > 0.05) {
            activity = Math.pow((distFromCenter - 0.05) / 0.45, 1.5);
          }

          const n = noise3D(x * NOISE_SCALE, y * NOISE_SCALE, time);
          const eff = n * (0.1 + activity * 1.2);

          let ci = 0;
          if (eff > 0.15) ci = 1;
          if (eff > 0.35) ci = 2;
          if (eff > 0.60) ci = 3;
          if (eff > 0.85) ci = 4;

          const idx = (y * w + x) * 4;
          data[idx] = PALETTE[ci][0];
          data[idx + 1] = PALETTE[ci][1];
          data[idx + 2] = PALETTE[ci][2];
          data[idx + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      time += SPEED;
      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#1271CB]"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

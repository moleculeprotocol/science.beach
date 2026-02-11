"use client";

import { useEffect, useRef } from "react";

const PIXEL_SIZE = 4;
const OCEAN_COLOR = [43, 122, 186];
const DEEP_OCEAN_COLOR = [18, 113, 203];
const OCEAN_RIPPLE_COLOR = [60, 139, 207];
const FOAM_COLOR = [255, 255, 255];
const SAND_DRY_COLOR = [243, 223, 198];
const SAND_WET_COLOR = [231, 207, 178];
const DEBRIS_COLORS = [
  [255, 111, 97],
  [255, 245, 238],
];

type PixelBeachProps = {
  className?: string;
};

export default function PixelBeach({ className }: PixelBeachProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId = 0;
    let ctx: CanvasRenderingContext2D | null = null;
    let width = 0;
    let height = 0;
    let time = 0;
    let waveCycle = 0;
    let wetnessGrid = new Float32Array(0);
    let debrisGrid = new Int8Array(0);
    let ripples: { x: number; y: number; width: number }[] = [];

    const init = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const newWidth = Math.ceil(rect.width / PIXEL_SIZE);
      const newHeight = Math.ceil(rect.height / PIXEL_SIZE);

      if (newWidth === width && newHeight === height && ctx) return;

      width = newWidth;
      height = newHeight;
      canvas.width = width;
      canvas.height = height;
      ctx = canvas.getContext("2d", { alpha: false });
      wetnessGrid = new Float32Array(width * height).fill(0);
      debrisGrid = new Int8Array(width * height).fill(0);
      ripples = [];
    };

    const observer = new ResizeObserver(() => {
      init();
    });
    observer.observe(container);
    init();

    const render = () => {
      if (!ctx || width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += 1;
      waveCycle += 0.006;
      const waveProgress = (Math.sin(waveCycle) + 1) / 2;
      const shoreTopY = height * 0.15;
      const shoreBottomY = height * 0.35;
      const currentBaseY = shoreTopY + waveProgress * (shoreBottomY - shoreTopY);

      if (Math.random() < 0.02) {
        ripples.push({
          x: Math.random() * width,
          y: Math.random() * Math.max(shoreTopY - 10, 1),
          width: 4 + Math.random() * 8,
        });
      }

      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].y += 0.1;
        if (ripples[i].y > currentBaseY - 2) ripples.splice(i, 1);
      }

      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      for (let x = 0; x < width; x++) {
        const columnNoise = Math.sin(x * 0.1 + time * 0.03) * 2 + Math.cos(x * 0.2 + time * 0.01) * 1.5;
        const waveY = currentBaseY + columnNoise;

        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          const gridIdx = y * width + x;
          let r = 0;
          let g = 0;
          let b = 0;
          const isWater = y < waveY;

          if (isWater) {
            const distToEdge = waveY - y;
            if (distToEdge <= 1.5) {
              [r, g, b] = FOAM_COLOR;
            } else if (y < height * 0.1 + columnNoise) {
              [r, g, b] = DEEP_OCEAN_COLOR;
            } else {
              [r, g, b] = OCEAN_COLOR;
            }

            if (debrisGrid[gridIdx] !== 0) debrisGrid[gridIdx] = 0;
            wetnessGrid[gridIdx] = 1.0;
          } else {
            if (wetnessGrid[gridIdx] > 0) {
              wetnessGrid[gridIdx] = Math.max(0, wetnessGrid[gridIdx] - 0.006);
            }

            if (wetnessGrid[gridIdx] > 0.95 && debrisGrid[gridIdx] === 0 && Math.random() < 0.0003) {
              debrisGrid[gridIdx] = Math.random() > 0.6 ? 1 : 2;
            }

            const wetness = wetnessGrid[gridIdx];
            r = SAND_DRY_COLOR[0] + (SAND_WET_COLOR[0] - SAND_DRY_COLOR[0]) * wetness;
            g = SAND_DRY_COLOR[1] + (SAND_WET_COLOR[1] - SAND_DRY_COLOR[1]) * wetness;
            b = SAND_DRY_COLOR[2] + (SAND_WET_COLOR[2] - SAND_DRY_COLOR[2]) * wetness;

            const debrisType = debrisGrid[gridIdx];
            if (debrisType !== 0) {
              [r, g, b] = DEBRIS_COLORS[debrisType - 1];
            }
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      for (const ripple of ripples) {
        const rippleY = Math.round(ripple.y);
        const startX = Math.round(ripple.x);
        const endX = Math.round(ripple.x + ripple.width);

        if (rippleY < 0 || rippleY >= height) continue;

        for (let rippleX = startX; rippleX < endX; rippleX++) {
          if (rippleX < 0 || rippleX >= width) continue;
          const columnNoise = Math.sin(rippleX * 0.1 + time * 0.03) * 2 + Math.cos(rippleX * 0.2 + time * 0.01) * 1.5;
          const waveY = currentBaseY + columnNoise;

          if (rippleY < waveY - 2) {
            const idx = (rippleY * width + rippleX) * 4;
            data[idx] = OCEAN_RIPPLE_COLOR[0];
            data[idx + 1] = OCEAN_RIPPLE_COLOR[1];
            data[idx + 2] = OCEAN_RIPPLE_COLOR[2];
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full w-full overflow-hidden bg-[#F3DFC6] ${className ?? ""}`}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}

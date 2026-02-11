"use client";

import { useEffect, useMemo, useState } from "react";
import AnimatedSvgSprite from "./AnimatedSvgSprite";
import { CRAB_COLOR_PALETTES, CRAB_SOURCE_COLORS } from "./crabColors";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

const CRAB_FRAME_SIZE = SVG_SOURCE_SIZES.animated.crab;
const CRAB_FRAME_PATHS = ["/animated/crab/crab-0.svg", "/animated/crab/crab-1.svg"] as const;

let crabSourceFramesPromise: Promise<string[]> | null = null;

function loadCrabSourceFrames(): Promise<string[]> {
  if (!crabSourceFramesPromise) {
    crabSourceFramesPromise = Promise.all(
      CRAB_FRAME_PATHS.map(async (framePath) => {
        const response = await fetch(framePath);
        if (!response.ok) {
          throw new Error(`Failed to load crab frame: ${framePath}`);
        }
        return response.text();
      }),
    );
  }

  return crabSourceFramesPromise;
}

function replaceHexColor(svg: string, sourceHex: string, targetHex: string) {
  const escapedSourceHex = sourceHex.replace("#", "\\#");
  return svg.replace(new RegExp(escapedSourceHex, "gi"), targetHex);
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export type CrabProps = {
  flipped?: boolean;
  frameDurationMs?: number;
  animationOffsetMs?: number;
  animate?: boolean;
  paletteIndex?: number;
};

export default function Crab({
  flipped = false,
  frameDurationMs = 260,
  animationOffsetMs = 0,
  animate = true,
  paletteIndex = 0,
}: CrabProps) {
  const [sourceFrames, setSourceFrames] = useState<string[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    loadCrabSourceFrames()
      .then((frames) => {
        if (mounted) {
          setSourceFrames(frames);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadFailed(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const safePaletteIndex = ((paletteIndex % CRAB_COLOR_PALETTES.length) + CRAB_COLOR_PALETTES.length) % CRAB_COLOR_PALETTES.length;
  const palette = CRAB_COLOR_PALETTES[safePaletteIndex];

  const recoloredFrameSrcs = useMemo(() => {
    if (!sourceFrames || !palette) {
      return undefined;
    }

    return sourceFrames.map((svgFrame) => {
      let coloredSvg = svgFrame;
      coloredSvg = replaceHexColor(coloredSvg, CRAB_SOURCE_COLORS.base, palette.base);
      coloredSvg = replaceHexColor(coloredSvg, CRAB_SOURCE_COLORS.mid, palette.mid);
      coloredSvg = replaceHexColor(coloredSvg, CRAB_SOURCE_COLORS.dark, palette.dark);
      coloredSvg = replaceHexColor(coloredSvg, CRAB_SOURCE_COLORS.deepest, palette.deepest);
      coloredSvg = replaceHexColor(coloredSvg, CRAB_SOURCE_COLORS.accent, palette.accent);
      return svgToDataUri(coloredSvg);
    });
  }, [palette, sourceFrames]);

  return (
    <div
      style={{
        position: "relative",
        width: CRAB_FRAME_SIZE.width,
        height: CRAB_FRAME_SIZE.height,
        isolation: "isolate",
      }}
    >
      <AnimatedSvgSprite
        name="crab"
        alt="pixel crab"
        width={CRAB_FRAME_SIZE.width}
        height={CRAB_FRAME_SIZE.height}
        frameSrcs={recoloredFrameSrcs}
        flipped={flipped}
        frameDurationMs={frameDurationMs}
        animationOffsetMs={animationOffsetMs}
        animate={animate}
        fallbackSrc={loadFailed ? "/animated/crab/crab-0.svg" : undefined}
        unoptimized
      />
    </div>
  );
}

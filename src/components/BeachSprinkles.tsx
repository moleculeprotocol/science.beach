"use client";

import { useMemo } from "react";
import Image from "next/image";
import AnimatedSvgSprite from "./AnimatedSvgSprite";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

type AnimatedDecorName = "grass" | "palm" | "rock" | "oasis";
type Side = "left" | "right";
const FEED_CONTAINER_HALF_WIDTH = 358;

type DecorItem =
  | {
      id: number;
      kind: "animated";
      name: AnimatedDecorName;
      side: Side;
      gutterOffset: number;
      y: number;
      flipped: boolean;
      opacity: number;
      frameDurationMs: number;
      animationOffsetMs: number;
      frameSrcs?: string[];
    }
  | {
      id: number;
      kind: "static";
      src: "/simple/beachchairs/bluechair.svg" | "/simple/beachchairs/redchair.svg";
      side: Side;
      gutterOffset: number;
      y: number;
      flipped: boolean;
      opacity: number;
    };

type BeachSprinklesProps = {
  seed?: number;
  className?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function randomSide(rand: () => number): Side {
  return rand() > 0.5 ? "right" : "left";
}

function pickY(rand: () => number, usedYs: number[], min: number, max: number, minGap = 16) {
  for (let i = 0; i < 16; i += 1) {
    const candidate = min + rand() * (max - min);
    if (usedYs.every((y) => Math.abs(y - candidate) >= minGap)) {
      usedYs.push(candidate);
      return candidate;
    }
  }

  const fallback = min + rand() * (max - min);
  usedYs.push(fallback);
  return fallback;
}

export default function BeachSprinkles({ seed = 77, className }: BeachSprinklesProps) {
  const items = useMemo<DecorItem[]>(() => {
    const rand = seededRandom(seed);
    let id = 0;
    const nextId = () => {
      id += 1;
      return id;
    };

    const placedItems: DecorItem[] = [];
    const usedYs: Record<Side, number[]> = { left: [], right: [] };
    const chairSide = randomSide(rand);

    const addAnimated = (
      name: AnimatedDecorName,
      side: Side,
      y: number,
      gutterOffset: number,
      frameDurationMs: number,
      animationOffsetMs: number,
      frameSrcs?: string[],
    ) => {
      placedItems.push({
        id: nextId(),
        kind: "animated",
        name,
        side,
        gutterOffset: clamp(gutterOffset, 8, 220),
        y: clamp(y, 6, 96),
        flipped: rand() > 0.5,
        opacity: 0.9,
        frameDurationMs,
        animationOffsetMs,
        frameSrcs,
      });
    };

    const addChair = (side: Side, y: number, gutterOffset: number) => {
      placedItems.push({
        id: nextId(),
        kind: "static",
        src: rand() > 0.5 ? "/simple/beachchairs/bluechair.svg" : "/simple/beachchairs/redchair.svg",
        side,
        gutterOffset: clamp(gutterOffset, 8, 220),
        y: clamp(y, 6, 96),
        flipped: rand() > 0.5,
        opacity: 0.92,
      });
    };

    const addPalmRestScene = (side: Side, yMin: number, yMax: number) => {
      const sceneY = pickY(rand, usedYs[side], yMin, yMax);
      const baseOffset = 22 + rand() * 30;

      addAnimated(
        "palm",
        side,
        sceneY - 12 + rand() * 4,
        baseOffset + 72 + rand() * 16,
        360 + Math.floor(rand() * 120),
        Math.floor(rand() * 1200),
      );
      addAnimated(
        "rock",
        side,
        sceneY + 10 + rand() * 5,
        baseOffset + 22 + rand() * 10,
        320 + Math.floor(rand() * 120),
        Math.floor(rand() * 900),
      );
      addAnimated(
        "grass",
        side,
        sceneY + 22 + rand() * 4,
        baseOffset + 18 + rand() * 8,
        240 + Math.floor(rand() * 80),
        Math.floor(rand() * 900),
      );

      if (side === chairSide) {
        addChair(side, sceneY + 20 + rand() * 4, baseOffset + 2 + rand() * 8);
      }
    };

    const addOasisScene = (side: Side, yMin: number, yMax: number) => {
      const sceneY = pickY(rand, usedYs[side], yMin, yMax);
      const baseOffset = 16 + rand() * 26;

      addAnimated(
        "oasis",
        side,
        sceneY + 12 + rand() * 3,
        baseOffset + 8,
        380 + Math.floor(rand() * 120),
        Math.floor(rand() * 1100),
        ["/animated/oasis/oasis-1.svg", "/animated/oasis/oasis-2.svg"],
      );
      addAnimated(
        "rock",
        side,
        sceneY + 5 + rand() * 4,
        baseOffset + 32 + rand() * 8,
        320 + Math.floor(rand() * 120),
        Math.floor(rand() * 900),
      );
      addAnimated(
        "grass",
        side,
        sceneY + 8 + rand() * 4,
        baseOffset + 38 + rand() * 8,
        240 + Math.floor(rand() * 80),
        Math.floor(rand() * 900),
      );
    };

    addPalmRestScene("left", 12, 40);
    addPalmRestScene("right", 44, 76);
    addOasisScene(rand() > 0.5 ? "left" : "right", 30, 86);

    return placedItems;
  }, [seed]);

  return (
    <div className={className ? `pointer-events-none absolute inset-0 ${className}` : "pointer-events-none absolute inset-0"}>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute"
          style={{
            top: `${item.y}%`,
            opacity: item.opacity,
            transform: item.flipped ? "scaleX(-1)" : undefined,
            transformOrigin: "center",
            ...(item.side === "left"
              ? {
                  left: `calc(50% - ${FEED_CONTAINER_HALF_WIDTH}px - ${item.gutterOffset + (item.kind === "animated" ? SVG_SOURCE_SIZES.animated[item.name].width : SVG_SOURCE_SIZES.static.blueChair.width)}px)`,
                }
              : {
                  left: `calc(50% + ${FEED_CONTAINER_HALF_WIDTH}px + ${item.gutterOffset}px)`,
                }),
          }}
        >
          {item.kind === "animated" ? (
            <AnimatedSvgSprite
              name={item.name}
              alt={`pixel ${item.name}`}
              width={SVG_SOURCE_SIZES.animated[item.name].width}
              height={SVG_SOURCE_SIZES.animated[item.name].height}
              frameSrcs={item.frameSrcs}
              flipped={false}
              frameDurationMs={item.frameDurationMs}
              animationOffsetMs={item.animationOffsetMs}
            />
          ) : (
            <Image
              src={item.src}
              alt="pixel beach chair"
              width={SVG_SOURCE_SIZES.static.blueChair.width}
              height={SVG_SOURCE_SIZES.static.blueChair.height}
              style={{ imageRendering: "pixelated" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

import type { CSSProperties } from "react";
import AnimatedSvgSprite from "./AnimatedSvgSprite";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

const ROCKS = [
  { x: 30, y: 18, flipped: true },
  { x: 62, y: 24, flipped: false },
];

const SIDE_PALMS = [
  { side: "left" as const, edgeOffsetPx: -18, topPx: -94, flipped: false },
  { side: "right" as const, edgeOffsetPx: -18, topPx: -90, flipped: true },
];
type BeachRocksProps = {
  className?: string;
  style?: CSSProperties;
};

export default function BeachRocks({ className, style }: BeachRocksProps) {
  return (
    <div
      className={className ? `pointer-events-none absolute w-full ${className}` : "pointer-events-none absolute w-full top-[280px] h-[120px]"}
      style={style}
    >
      {ROCKS.map((rock, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${rock.x}%`,
            top: `${rock.y}%`,
          }}
        >
          <AnimatedSvgSprite
            name="rock"
            alt="pixel rock"
            width={SVG_SOURCE_SIZES.animated.rock.width}
            height={SVG_SOURCE_SIZES.animated.rock.height}
            flipped={rock.flipped}
            frameDurationMs={330 + (i % 2) * 80}
            animationOffsetMs={i * 140}
            fallbackSrc="/rock.svg"
          />
        </div>
      ))}
      {SIDE_PALMS.map((palm, i) => (
        <div
          key={`palm-${i}`}
          className="absolute"
          style={{
            top: `${palm.topPx}px`,
            ...(palm.side === "left"
              ? { left: `${palm.edgeOffsetPx}px` }
              : { right: `${palm.edgeOffsetPx}px` }),
          }}
        >
          <AnimatedSvgSprite
            name="palm"
            alt="pixel palm"
            width={SVG_SOURCE_SIZES.animated.palm.width}
            height={SVG_SOURCE_SIZES.animated.palm.height}
            flipped={palm.flipped}
            frameDurationMs={420 + i * 90}
            animationOffsetMs={i * 180}
          />
        </div>
      ))}
    </div>
  );
}

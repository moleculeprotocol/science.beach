"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AnimatedSvgSprite from "./AnimatedSvgSprite";
import Crab from "./Crab";
import { CRAB_NAME_TO_INDEX } from "./crabColors";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

type CursorTone =
  | "blue"
  | "cyan"
  | "green"
  | "orange"
  | "pink"
  | "red"
  | "yellow";

type BubbleWidthClassName = "w-[111px]" | "w-[198px]";

type PositionedSceneNode = {
  id: string;
  motionClassName?: string;
  positionClassName: string;
};

type CursorSpec = PositionedSceneNode & {
  label: string;
  tone: CursorTone;
};

type BubbleSpec = PositionedSceneNode & {
  bubbleWidthClassName?: BubbleWidthClassName;
  message: string;
  tailSide?: "left" | "right";
};

type AnimatedAssetSpec = {
  id: string;
  animationOffsetMs?: number;
  flipped?: boolean;
  frameDurationMs: number;
  name: keyof typeof SVG_SOURCE_SIZES.animated;
  positionClassName: string;
  scaleClassName: string;
  sizeClassName: string;
};

type StaticAssetSpec = {
  id: string;
  height: number;
  positionClassName: string;
  sizeClassName: string;
  src: string;
  width: number;
};

type CrabSpec = PositionedSceneNode & {
  animationOffsetMs?: number;
  cap?: CursorTone;
  capMotionClassName?: string;
  capPositionClassName?: string;
  color: keyof typeof CRAB_NAME_TO_INDEX;
  flipped?: boolean;
  frameDurationMs: number;
  scaleClassName?: string;
  sizeClassName?: string;
};

type ClusterLayout = {
  id: string;
  animatedAssets: readonly AnimatedAssetSpec[];
  bubbles: readonly BubbleSpec[];
  crabs: readonly CrabSpec[];
  cursors: readonly CursorSpec[];
  originClassName: string;
  sizeClassName: string;
  staticAssets: readonly StaticAssetSpec[];
};

function joinClasses(...parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const PIXEL_CURSOR_CELLS = [
  { position: "left-[1px] top-[1px]", shade: "light" },
  { position: "left-[3px] top-[1px]", shade: "light" },
  { position: "left-[7px] top-[1px]", shade: "light" },
  { position: "left-[9px] top-[1px]", shade: "light" },
  { position: "left-[3px] top-[3px]", shade: "mid" },
  { position: "left-[3px] top-[5px]", shade: "dark" },
  { position: "left-[3px] top-[7px]", shade: "dark" },
  { position: "left-[1px] top-[9px]", shade: "dark" },
  { position: "left-[3px] top-[9px]", shade: "dark" },
  { position: "left-[5px] top-[3px]", shade: "dark" },
  { position: "left-[5px] top-[5px]", shade: "dark" },
  { position: "left-[7px] top-[3px]", shade: "dark" },
  { position: "left-[9px] top-[3px]", shade: "dark" },
  { position: "left-[1px] top-[3px]", shade: "mid" },
  { position: "left-[1px] top-[5px]", shade: "mid" },
  { position: "left-[1px] top-[7px]", shade: "mid" },
] as const;

const CURSOR_TONES: Record<
  CursorTone,
  {
    badge: string;
    dark: string;
    light: string;
    mid: string;
    text: string;
    textShadow: string;
  }
> = {
  blue: {
    badge: "bg-[#228df4]",
    dark: "bg-[#1271cb]",
    light: "bg-[#56a0e7]",
    mid: "bg-[#228df4]",
    text: "text-[#12508b]",
    textShadow: "[text-shadow:0_-1px_0_#56a0e7,0_1px_0_#1271cb]",
  },
  cyan: {
    badge: "bg-[#28e5e2]",
    dark: "bg-[#12cbcb]",
    light: "bg-[#56d4e7]",
    mid: "bg-[#28e5e2]",
    text: "text-[#128b8b]",
    textShadow: "[text-shadow:0_-1px_0_#56d4e7,0_1px_0_#128b8b]",
  },
  green: {
    badge: "bg-[#67ff4c]",
    dark: "bg-[#3cbb25]",
    light: "bg-[#a6ff96]",
    mid: "bg-[#67ff4c]",
    text: "text-[#227613]",
    textShadow: "[text-shadow:0_-1px_0_#a6ff96,0_1px_0_#3cbb25]",
  },
  orange: {
    badge: "bg-[#ff4d00]",
    dark: "bg-[#bc3800]",
    light: "bg-[#ff6b00]",
    mid: "bg-[#ff4d00]",
    text: "text-[#6b2000]",
    textShadow: "[text-shadow:0_-1px_0_#ff6b00,0_1px_0_#bc3800]",
  },
  pink: {
    badge: "bg-[#ff00ee]",
    dark: "bg-[#a20097]",
    light: "bg-[#ff5cf4]",
    mid: "bg-[#ff00ee]",
    text: "text-[#52004d]",
    textShadow: "[text-shadow:0_-1px_0_#ff5cf4,0_1px_0_#a20097]",
  },
  red: {
    badge: "bg-[#ff0700]",
    dark: "bg-[#940900]",
    light: "bg-[#ff312b]",
    mid: "bg-[#ff0700]",
    text: "text-[#480900]",
    textShadow: "[text-shadow:0_-1px_0_#ff312b,0_1px_0_#940900]",
  },
  yellow: {
    badge: "bg-[#ffda33]",
    dark: "bg-[#cb8400]",
    light: "bg-[#ffda33]",
    mid: "bg-[#ffda33]",
    text: "text-[#673f00]",
    textShadow: "[text-shadow:0_-1px_0_#ffda33,0_1px_0_#673f00]",
  },
};

const TONE_LABEL: Record<CursorTone, string> = {
  blue:   "Hypothesis",
  cyan:   "Control",
  green:  "Analyze",
  orange: "Variable",
  pink:   "Peer Review",
  red:    "Observe",
  yellow: "Replicate",
};

// These positions are authored against the 1680px desktop header frame from Figma.
const HEADER_FREE_CURSORS: readonly CursorSpec[] = [];

const LEFT_CLUSTER_LAYOUT: ClusterLayout = {
  id: "left",
  animatedAssets: [
    {
      frameDurationMs: 1400,
      id: "left-rock",
      name: "rock",
      positionClassName: "left-[39px] top-[52px]",
      scaleClassName: "scale-[0.25]",
      sizeClassName: "h-[30px] w-[30px]",
    },
    {
      frameDurationMs: 1200,
      id: "left-palm",
      name: "palm",
      positionClassName: "left-[84px] top-0",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[80px] w-[64px]",
    },
    {
      frameDurationMs: 900,
      id: "left-grass-a",
      name: "grass",
      positionClassName: "left-[31px] top-[112px]",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[9px] w-[15px]",
    },
    {
      frameDurationMs: 1020,
      id: "left-grass-b",
      name: "grass",
      positionClassName: "left-[206px] top-[248px]",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[9px] w-[15px]",
    },
  ],
  bubbles: [
    {
      bubbleWidthClassName: "w-[111px]",
      id: "left-callout",
      message: "Check this out",
      motionClassName: "[animation:pixel-bubble-a_22000ms_ease-in-out_2400ms_infinite]",
      positionClassName: "left-[74px] top-[176px]",
    },
  ],
  crabs: [
    {
      cap: "pink",
      capMotionClassName: "[--pixel-drift-x:10px] [--pixel-drift-y:5px] [animation:pixel-drift_3800ms_ease-in-out_0ms_infinite]",
      capPositionClassName: "left-[-8px] top-[-28px]",
      color: "pink",
      frameDurationMs: 840,
      id: "left-pink",
      motionClassName:
        "[--pixel-drift-x:-3px] [--pixel-drift-y:2px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[82px] top-[88px]",
    },
    {
      animationOffsetMs: 120,
      cap: "cyan",
      capMotionClassName: "[--pixel-drift-x:-8px] [--pixel-drift-y:4px] [animation:pixel-drift_4400ms_ease-in-out_600ms_infinite]",
      capPositionClassName: "left-[6px] top-[-32px]",
      color: "cyan",
      frameDurationMs: 900,
      id: "left-cyan",
      motionClassName:
        "[--pixel-drift-x:4px] [--pixel-drift-y:-3px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[148px] top-[72px]",
    },
    {
      animationOffsetMs: 240,
      cap: "blue",
      capMotionClassName: "[--pixel-drift-x:7px] [--pixel-drift-y:-5px] [animation:pixel-drift_4000ms_ease-in-out_300ms_infinite]",
      capPositionClassName: "left-[0px] top-[-24px]",
      color: "blue",
      flipped: true,
      frameDurationMs: 780,
      id: "left-blue",
      motionClassName:
        "[--pixel-drift-x:3px] [--pixel-drift-y:0px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[204px] top-[84px]",
    },
    {
      animationOffsetMs: 160,
      cap: "red",
      capMotionClassName: "[--pixel-drift-x:-6px] [--pixel-drift-y:8px] [animation:pixel-drift_3400ms_ease-in-out_900ms_infinite]",
      capPositionClassName: "left-[-4px] top-[-26px]",
      color: "red",
      frameDurationMs: 760,
      id: "left-red-upper",
      motionClassName:
        "[--pixel-drift-x:-2px] [--pixel-drift-y:1px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[2px] top-[152px]",
    },
    {
      animationOffsetMs: 200,
      cap: "red",
      capMotionClassName: "[--pixel-drift-x:5px] [--pixel-drift-y:-4px] [animation:pixel-drift_4800ms_ease-in-out_450ms_infinite]",
      capPositionClassName: "left-[2px] top-[-24px]",
      color: "red",
      flipped: true,
      frameDurationMs: 860,
      id: "left-red-lower",
      motionClassName:
        "[--pixel-drift-x:2px] [--pixel-drift-y:0px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[100px] top-[206px]",
    },
  ],
  cursors: [],
  originClassName: "hidden md:block left-0 top-[146px] md:left-[60px] md:top-[398px] xl:left-0 xl:top-[146px]",
  sizeClassName: "h-[275px] w-[266px]",
  staticAssets: [
    {
      height: SVG_SOURCE_SIZES.static.blueChair.height,
      id: "left-chair",
      positionClassName: "left-[133px] top-[158px]",
      sizeClassName: "h-[16px] w-[33px]",
      src: "/simple/beachchairs/bluechair.svg",
      width: SVG_SOURCE_SIZES.static.blueChair.width,
    },
  ],
};

const RIGHT_CLUSTER_LAYOUT: ClusterLayout = {
  id: "right",
  animatedAssets: [
    {
      flipped: true,
      frameDurationMs: 1200,
      id: "right-palm",
      name: "palm",
      positionClassName: "left-[67px] top-[149px]",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[80px] w-[64px]",
    },
    {
      frameDurationMs: 1500,
      id: "right-rock",
      name: "rock",
      positionClassName: "left-[84px] top-[216px]",
      scaleClassName: "scale-[0.25]",
      sizeClassName: "h-[30px] w-[30px]",
    },
    {
      frameDurationMs: 880,
      id: "right-grass-a",
      name: "grass",
      positionClassName: "left-[121px] top-[61px]",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[9px] w-[15px]",
    },
    {
      frameDurationMs: 960,
      id: "right-grass-b",
      name: "grass",
      positionClassName: "left-[273px] top-[274px]",
      scaleClassName: "scale-[0.5]",
      sizeClassName: "h-[9px] w-[15px]",
    },
  ],
  bubbles: [
    {
      bubbleWidthClassName: "w-[198px]",
      id: "right-callout",
      message:
        "I found some new radical novelty. I've been instructed to research mTOR inhibitor, Rapamycin.",
      motionClassName: "[animation:pixel-bubble-b_24000ms_ease-in-out_2200ms_infinite]",
      positionClassName: "left-[111px] top-[11px]",
    },
  ],
  crabs: [
    {
      animationOffsetMs: 80,
      cap: "yellow",
      capMotionClassName: "[--pixel-drift-x:9px] [--pixel-drift-y:5px] [animation:pixel-drift_4200ms_ease-in-out_200ms_infinite]",
      capPositionClassName: "left-[-6px] top-[-30px]",
      color: "yellow",
      frameDurationMs: 920,
      id: "right-yellow-left",
      motionClassName:
        "[--pixel-drift-x:3px] [--pixel-drift-y:0px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[118px] top-[142px]",
    },
    {
      animationOffsetMs: 220,
      cap: "red",
      capMotionClassName: "[--pixel-drift-x:-8px] [--pixel-drift-y:-4px] [animation:pixel-drift_3600ms_ease-in-out_750ms_infinite]",
      capPositionClassName: "left-[4px] top-[-26px]",
      color: "red",
      frameDurationMs: 980,
      id: "right-red-top",
      motionClassName:
        "[--pixel-drift-x:-4px] [--pixel-drift-y:2px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[172px] top-[108px]",
    },
    {
      cap: "yellow",
      capMotionClassName: "[--pixel-drift-x:6px] [--pixel-drift-y:6px] [animation:pixel-drift_4600ms_ease-in-out_100ms_infinite]",
      capPositionClassName: "left-[-4px] top-[-28px]",
      color: "yellow",
      flipped: true,
      frameDurationMs: 760,
      id: "right-yellow-right",
      motionClassName:
        "[--pixel-drift-x:2px] [--pixel-drift-y:-2px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[218px] top-[148px]",
    },
    {
      animationOffsetMs: 200,
      cap: "red",
      capMotionClassName: "[--pixel-drift-x:-5px] [--pixel-drift-y:-6px] [animation:pixel-drift_3800ms_ease-in-out_550ms_infinite]",
      capPositionClassName: "left-[0px] top-[-24px]",
      color: "red",
      frameDurationMs: 800,
      id: "right-red-lower",
      motionClassName:
        "[--pixel-drift-x:-3px] [--pixel-drift-y:1px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[112px] top-[232px]",
    },
    {
      animationOffsetMs: 180,
      cap: "red",
      capMotionClassName: "[--pixel-drift-x:7px] [--pixel-drift-y:4px] [animation:pixel-drift_4200ms_ease-in-out_350ms_infinite]",
      capPositionClassName: "left-[-8px] top-[-26px]",
      color: "red",
      flipped: true,
      frameDurationMs: 860,
      id: "right-red-edge",
      motionClassName:
        "[--pixel-drift-x:2px] [--pixel-drift-y:0px] [animation:pixel-drift_3600ms_ease-in-out_infinite]",
      positionClassName: "left-[314px] top-[188px]",
    },
  ],
  cursors: [],
  originClassName: "left-1/2 -translate-x-1/2 top-[240px] md:translate-x-0 md:left-auto md:right-[60px] md:top-[379px] xl:right-0 xl:top-[151px]",
  sizeClassName: "h-[331px] w-[354px]",
  staticAssets: [],
};

const HEADER_CLUSTER_LAYOUTS: readonly ClusterLayout[] = [
  LEFT_CLUSTER_LAYOUT,
  RIGHT_CLUSTER_LAYOUT,
];

function PixelCursor({
  label,
  motionClassName,
  positionClassName,
  tone,
}: CursorSpec) {
  const theme = CURSOR_TONES[tone];

  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "pointer-events-none absolute z-[120] flex select-none items-start gap-[4px]",
        positionClassName,
        motionClassName,
      )}
    >
      <div className="relative h-[12px] w-[12px] shrink-0 overflow-visible drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)]">
        {PIXEL_CURSOR_CELLS.map((cell, index) => (
          <span
            key={`${tone}-${index}`}
            className={`absolute h-[2px] w-[2px] ${cell.position} ${theme[cell.shade]}`}
          />
        ))}
      </div>
      <div
        className={`flex items-center justify-center px-[4px] py-[4px] drop-shadow-[2px_2px_0_rgba(0,0,0,0.25)] ${theme.badge}`}
      >
        <span
          className={`whitespace-nowrap font-quicksand text-[11px] font-bold leading-[0.9] ${theme.text} ${theme.textShadow}`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function BubbleTail({ tailSide = "left" }: { tailSide?: "left" | "right" }) {
  return (
    <div
      className={`relative h-[6px] w-[10px] ${tailSide === "right" ? "[transform:scaleX(-1)]" : ""}`}
    >
      <div className="absolute left-0 top-0 h-[2px] w-[2px] bg-day-3" />
      <div className="absolute left-[2px] top-0 h-[2px] w-[2px] bg-day-6" />
      <div className="absolute left-[4px] top-0 h-[2px] w-[2px] bg-day-6" />
      <div className="absolute left-[6px] top-0 h-[2px] w-[2px] bg-day-6" />
      <div className="absolute left-[8px] top-0 h-[2px] w-[2px] bg-day-6" />
      <div className="absolute left-0 top-[2px] h-[2px] w-[2px] bg-day-3" />
      <div className="absolute left-[2px] top-[2px] h-[2px] w-[2px] bg-day-3" />
      <div className="absolute left-[4px] top-[2px] h-[2px] w-[2px] bg-day-3" />
      <div className="absolute left-[6px] top-[2px] h-[2px] w-[2px] bg-day-3" />
      <div className="absolute left-0 top-[4px] h-[2px] w-[2px] bg-day-3" />
    </div>
  );
}

function SpeechBubble({
  bubbleWidthClassName = "w-[198px]",
  message,
  motionClassName,
  positionClassName,
  tailSide = "left",
}: BubbleSpec) {
  return (
    <div
      aria-hidden="true"
      className={joinClasses(
        "pointer-events-none absolute z-[70] hidden sm:flex flex-col",
        positionClassName,
        motionClassName,
      )}
    >
      <div
        className={`${bubbleWidthClassName} border-b-2 border-r-2 border-day-4 bg-day-1 px-[10px] py-[8px]`}
      >
        <p className="font-quicksand text-[13px] leading-[1.6] text-night-1 text-shadow-bubble xl:text-[14px]">
          {message}
        </p>
      </div>
      <div className={tailSide === "right" ? "self-end" : ""}>
        <BubbleTail tailSide={tailSide} />
      </div>
    </div>
  );
}

function AnimatedBeachAsset({
  animationOffsetMs = 0,
  flipped = false,
  frameDurationMs,
  name,
  positionClassName,
  scaleClassName,
  sizeClassName,
}: AnimatedAssetSpec) {
  const size = SVG_SOURCE_SIZES.animated[name];

  return (
    <div
      className={joinClasses(
        "pointer-events-none absolute z-[10]",
        positionClassName,
        sizeClassName,
      )}
    >
      <div className={`origin-top-left ${scaleClassName}`}>
        <AnimatedSvgSprite
          name={name}
          alt={`pixel ${name}`}
          width={size.width}
          height={size.height}
          frameDurationMs={frameDurationMs}
          animationOffsetMs={animationOffsetMs}
          flipped={flipped}
        />
      </div>
    </div>
  );
}

function StaticBeachAsset({
  height,
  positionClassName,
  sizeClassName,
  src,
  width,
}: StaticAssetSpec) {
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={joinClasses(
        "pointer-events-none absolute z-[10] object-contain [image-rendering:pixelated]",
        positionClassName,
        sizeClassName,
      )}
    />
  );
}

function FloatingCrab({
  animationOffsetMs = 0,
  cap,
  capMotionClassName,
  capPositionClassName = "left-[0px] top-[-20px]",
  color,
  flipped = false,
  frameDurationMs,
  id,
  motionClassName,
  positionClassName,
  scaleClassName = "scale-[0.3334]",
  sizeClassName = "size-[40px]",
}: CrabSpec) {
  return (
    <div
      className={joinClasses(
        "pointer-events-none absolute overflow-visible",
        sizeClassName,
        positionClassName,
        motionClassName,
      )}
    >
      {cap && (
        <PixelCursor
          id={`${id}-cap`}
          label={TONE_LABEL[cap]}
          motionClassName={capMotionClassName}
          positionClassName={capPositionClassName}
          tone={cap}
        />
      )}
      <div className={`origin-top-left ${scaleClassName}`}>
        <Crab
          paletteIndex={CRAB_NAME_TO_INDEX[color]}
          frameDurationMs={frameDurationMs}
          animationOffsetMs={animationOffsetMs}
          flipped={flipped}
        />
      </div>
    </div>
  );
}

function DecorationCluster({ layout }: { layout: ClusterLayout }) {
  return (
    <div
      className={joinClasses(
        "pointer-events-none absolute",
        layout.originClassName,
      )}
    >
      <div className={joinClasses("relative select-none", layout.sizeClassName)}>
        {layout.cursors.map((cursor) => (
          <PixelCursor key={cursor.id} {...cursor} />
        ))}
        {layout.animatedAssets.map((asset) => (
          <AnimatedBeachAsset key={asset.id} {...asset} />
        ))}
        {layout.staticAssets.map((asset) => (
          <StaticBeachAsset key={asset.id} {...asset} />
        ))}
        {layout.crabs.map((crab) => (
          <FloatingCrab key={crab.id} {...crab} />
        ))}
        {layout.bubbles.map((bubble) => (
          <SpeechBubble key={bubble.id} {...bubble} />
        ))}
      </div>
    </div>
  );
}

export default function HomeHeaderAnimations() {
  const hunterRef = useRef<HTMLDivElement | null>(null);
  const [showHunter, setShowHunter] = useState(false);

  useEffect(() => {
    const hunter = hunterRef.current;
    const cta = document.querySelector<HTMLElement>(
      "[data-register-agent-cta='desktop']",
    );

    if (!hunter) {
      return;
    }

    if (!cta) {
      setShowHunter(false);
      return;
    }

    let removePulseTimer = 0;
    const shouldShowHunter = () =>
      window.innerWidth >= 1280 && window.scrollY < 220;

    const syncHunterVisibility = () => {
      const nextShowHunter = shouldShowHunter();
      setShowHunter((current) =>
        current === nextShowHunter ? current : nextShowHunter,
      );
    };

    const pulseCta = () => {
      if (!shouldShowHunter()) {
        return;
      }

      cta.classList.remove("register-agent-cta-pulse");
      void cta.offsetWidth;
      cta.classList.add("register-agent-cta-pulse");

      window.clearTimeout(removePulseTimer);
      removePulseTimer = window.setTimeout(() => {
        cta.classList.remove("register-agent-cta-pulse");
      }, 900);
    };

    const handleIteration = () => pulseCta();
    const initialPulse = window.setTimeout(pulseCta, 5400);

    syncHunterVisibility();
    hunter.addEventListener("animationiteration", handleIteration);
    window.addEventListener("resize", syncHunterVisibility);
    window.addEventListener("scroll", syncHunterVisibility, { passive: true });

    return () => {
      window.clearTimeout(initialPulse);
      window.clearTimeout(removePulseTimer);
      hunter.removeEventListener("animationiteration", handleIteration);
      window.removeEventListener("resize", syncHunterVisibility);
      window.removeEventListener("scroll", syncHunterVisibility);
      cta.classList.remove("register-agent-cta-pulse");
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[45] block"
      >
        <div className="relative mx-auto h-full w-full max-w-[1680px]">
          {HEADER_FREE_CURSORS.map((cursor) => (
            <PixelCursor key={cursor.id} {...cursor} />
          ))}
          {HEADER_CLUSTER_LAYOUTS.map((layout) => (
            <DecorationCluster key={layout.id} layout={layout} />
          ))}
        </div>
      </div>
      <div
        ref={hunterRef}
        aria-hidden="true"
        className={`pointer-events-none fixed right-[360px] top-[132px] z-[60] hidden select-none items-start gap-[4px] transition-opacity duration-300 xl:flex 2xl:right-[420px] [animation:pixel-cta-hunt_9000ms_linear_infinite] ${
          showHunter ? "opacity-100" : "opacity-0"
        }`}
      >
        <PixelCursor
          id="hunter"
          label="Pink"
          positionClassName="left-0 top-0"
          tone="pink"
        />
      </div>
    </>
  );
}

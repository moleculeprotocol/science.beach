"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";
import { CRAB_BG_CLASS } from "./crabColors";
import {
  recolorStaticCrabSvg,
  svgToDataUri,
  normalizeColorName,
} from "@/lib/recolorCrab";

let crabSvgPromise: Promise<string> | null = null;
function loadStaticCrabSvg(): Promise<string> {
  if (!crabSvgPromise) {
    crabSvgPromise = fetch("/crab.svg").then((r) => r.text());
  }
  return crabSvgPromise;
}

const SIZES = {
  xs: {
    box: "w-8 h-8",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
  feed: {
    box: "w-10 h-10",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
  fill: {
    box: "w-10 h-full",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
  sm: {
    box: "w-[90px] h-[64px]",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
  md: {
    box: "w-[90px] h-[64px]",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
  lg: {
    box: "w-[80px] h-[80px]",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
} as const;

type AvatarClientProps = {
  bg?: string | null;
  size?: keyof typeof SIZES;
};

export default function AvatarClient({ bg, size = "md" }: AvatarClientProps) {
  const [svgText, setSvgText] = useState<string | null>(null);

  useEffect(() => {
    loadStaticCrabSvg().then(setSvgText);
  }, []);

  const colorName = normalizeColorName(bg);
  const bgClass = CRAB_BG_CLASS[colorName];
  const { box, imgW, imgH } = SIZES[size];

  const src = useMemo(() => {
    if (!svgText) return "/crab.svg";
    return svgToDataUri(recolorStaticCrabSvg(svgText, colorName));
  }, [svgText, colorName]);

  return (
    <div
      className={`relative ${box} ${bgClass} shrink-0 overflow-hidden rounded-sm border border-dawn-2`}
    >
      <Image
        src={src}
        alt="avatar"
        width={imgW}
        height={imgH}
        unoptimized
        className="[image-rendering:pixelated] absolute inset-0 m-auto"
      />
    </div>
  );
}

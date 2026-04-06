import Image from "next/image";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";
import { CRAB_BG_CLASS } from "./crabColors";
import {
  recolorStaticCrabSvg,
  svgToDataUri,
  normalizeColorName,
} from "@/lib/recolorCrab";

let cachedSvgText: string | null = null;
async function getStaticCrabSvg(): Promise<string> {
  if (!cachedSvgText) {
    cachedSvgText = await readFile(
      join(process.cwd(), "public/crab.svg"),
      "utf-8",
    );
  }
  return cachedSvgText;
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

type AvatarProps = {
  bg?: string | null;
  size?: keyof typeof SIZES;
};

export default async function Avatar({ bg, size = "md" }: AvatarProps) {
  const colorName = normalizeColorName(bg);
  const svgText = await getStaticCrabSvg();
  const recolored = recolorStaticCrabSvg(svgText, colorName);
  const src = svgToDataUri(recolored);
  const bgClass = CRAB_BG_CLASS[colorName];
  const { box, imgW, imgH } = SIZES[size];

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

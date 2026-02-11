import Image from "next/image";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

const SIZES = {
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
    box: "w-[90px] h-[64px]",
    imgW: SVG_SOURCE_SIZES.static.crab.width,
    imgH: SVG_SOURCE_SIZES.static.crab.height,
  },
} as const;

type AvatarProps = {
  bg?: string | null;
  size?: keyof typeof SIZES;
};

export default function Avatar({ bg, size = "md" }: AvatarProps) {
  const color = bg === "yellow" ? "var(--yellow-4)" : "var(--green-4)";
  const { box, imgW, imgH } = SIZES[size];

  return (
    <div
      className={`relative ${box} shrink-0 border border-smoke-5 overflow-hidden`}
      style={{ backgroundColor: color }}
    >
      <Image
        src="/crab.svg"
        alt="avatar"
        width={imgW}
        height={imgH}
        className="absolute inset-0 m-auto"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

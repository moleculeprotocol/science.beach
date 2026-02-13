import Image from "next/image";
import { SVG_SOURCE_SIZES } from "./svgSourceSizes";

const SIZES = {
  xs: {
    box: "w-8 h-8",
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

export default function Avatar({ bg, size = "md" }: AvatarProps) {
  const bgClass = bg === "yellow" ? "bg-yellow-4" : "bg-green-4";
  const { box, imgW, imgH } = SIZES[size];

  return (
    <div className={`relative ${box} ${bgClass} shrink-0 overflow-hidden border border-smoke-5`}>
      <Image
        src="/crab.svg"
        alt="avatar"
        width={imgW}
        height={imgH}
        className="[image-rendering:pixelated] absolute inset-0 m-auto"
      />
    </div>
  );
}

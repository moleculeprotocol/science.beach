import Image from "next/image";

export type CrabProps = {
  color: string;
  size?: number;
  flipped?: boolean;
};

export default function Crab({ color, size = 60, flipped = false }: CrabProps) {
  const h = Math.round(size * (64 / 90));
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: h,
        transform: flipped ? "scaleX(-1)" : undefined,
        isolation: "isolate",
      }}
    >
      <Image
        src="/crab.svg"
        alt="pixel crab"
        width={size}
        height={h}
        style={{ imageRendering: "pixelated" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: color,
          mixBlendMode: "color",
          pointerEvents: "none",
          WebkitMaskImage: "url('/crab.svg')",
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskImage: "url('/crab.svg')",
          maskSize: "contain",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

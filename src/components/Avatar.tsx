import Image from "next/image";

const SIZES = {
  sm: { box: "size-5", img: 18 },
  md: { box: "size-8", img: 30 },
  lg: { box: "size-12", img: 44 },
} as const;

type AvatarProps = {
  bg?: string | null;
  size?: keyof typeof SIZES;
};

export default function Avatar({ bg, size = "md" }: AvatarProps) {
  const color = bg === "yellow" ? "var(--yellow-4)" : "var(--green-4)";
  const { box, img } = SIZES[size];

  return (
    <div
      className={`relative ${box} shrink-0 border border-smoke-5 overflow-hidden`}
      style={{ backgroundColor: color }}
    >
      <Image
        src="/crab.svg"
        alt="avatar"
        width={img}
        height={img}
        className="absolute inset-0 m-auto"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}

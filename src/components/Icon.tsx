type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
};

export default function Icon({
  name,
  size = 16,
  color = "currentColor",
  className = "",
}: IconProps) {
  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        maskImage: `url(/icons/${name}.svg)`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
}

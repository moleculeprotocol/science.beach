type IconProps = {
  name: string;
  size?: number;
  color?: string;
  className?: string;
};

const ICON_MASK_CLASS: Record<string, string> = {
  comment: "icon-mask-comment",
  download: "icon-mask-download",
  heart: "icon-mask-heart",
  share: "icon-mask-share",
  "sort-breakthrough": "icon-mask-sort-breakthrough",
  "sort-latest": "icon-mask-sort-latest",
  "sort-peer-reviewed": "icon-mask-sort-peer-reviewed",
  "sort-under-review": "icon-mask-sort-under-review",
  "sort-random": "icon-mask-sort-random",
};

const ICON_SIZE_CLASS: Record<number, string> = {
  15: "h-[15px] w-[15px]",
  12: "size-3",
  16: "size-4",
  20: "size-5",
  24: "size-6",
};

const ICON_COLOR_CLASS: Record<string, string> = {
  "var(--smoke-5)": "text-smoke-5",
  "var(--green-4)": "text-green-4",
  "var(--red-4)": "text-red-4",
  currentColor: "text-current",
};

export default function Icon({
  name,
  size = 16,
  color = "currentColor",
  className = "",
}: IconProps) {
  const maskClass = ICON_MASK_CLASS[name] ?? "";
  const sizeClass = ICON_SIZE_CLASS[size] ?? "size-4";
  const colorClass = ICON_COLOR_CLASS[color] ?? "text-current";

  return (
    <span
      className={`inline-block shrink-0 bg-current [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain] ${maskClass} ${sizeClass} ${colorClass} ${className}`}
      aria-hidden="true"
    />
  );
}

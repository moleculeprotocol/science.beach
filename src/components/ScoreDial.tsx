import type { Tier } from "@/lib/scoring";

const TIER_TAG_STYLES: Record<Tier, { bg: string; text: string; border: string }> = {
  unranked: { bg: "bg-sand-4", text: "text-sand-8", border: "border-sand-4" },
  bronze: { bg: "bg-tier-bronze", text: "text-sand-1", border: "border-tier-bronze" },
  silver: { bg: "bg-tier-silver", text: "text-sand-8", border: "border-tier-silver" },
  gold: { bg: "bg-yellow-4", text: "text-yellow-6", border: "border-yellow-4" },
  diamond: { bg: "bg-blue-4", text: "text-sand-1", border: "border-blue-4" },
  platinum: { bg: "bg-tier-platinum", text: "text-sand-8", border: "border-tier-platinum" },
};

function segmentColor(value: number): string {
  if (value >= 60) return "var(--green-4, #67ff4c)";
  if (value >= 30) return "var(--yellow-4, #ffda33)";
  return "var(--red-4, #ff4c6a)";
}

type ScoreDialProps = {
  value: number;
  tier: Tier;
  breakdown?: [number, number, number];
};

export default function ScoreDial({ value, tier, breakdown }: ScoreDialProps) {
  const viewBox = 72;
  const strokeWidth = 8;
  const radius = (viewBox - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments = breakdown ?? [33, 33, 34];
  const total = segments.reduce((a, b) => a + b, 0);

  const gapSize = 2; // px gap between segments
  let offset = -circumference / 4; // start at top

  const tag = TIER_TAG_STYLES[tier];

  return (
    <div className="relative flex aspect-square h-full shrink-0 items-center justify-center self-stretch">
        <svg viewBox={`0 0 ${viewBox} ${viewBox}`} className="absolute inset-0 size-full">
          <circle
            cx={viewBox / 2}
            cy={viewBox / 2}
            r={radius}
            fill="none"
            stroke="var(--sand-3)"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => {
            const rawDash = (seg / total) * circumference;
            const dashLength = Math.max(0, rawDash - gapSize);
            const gap = circumference - dashLength;
            const currentOffset = offset + gapSize / 2;
            offset += rawDash;
            return (
              <circle
                key={i}
                cx={viewBox / 2}
                cy={viewBox / 2}
                r={radius}
                fill="none"
                stroke={segmentColor(seg)}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${gap}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div
          className={`relative flex items-center justify-center border px-2 py-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] rounded-sm ${tag.bg} ${tag.border}`}
        >
          <span className={`font-bold text-[22px] leading-[0.9] ${tag.text}`}>
            {value}
          </span>
        </div>
    </div>
  );
}

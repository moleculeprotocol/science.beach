import type { Tier } from "@/lib/scoring";

const TIER_BORDER_CLASS: Record<Tier, string> = {
  unranked: "border-sand-4",
  bronze: "border-tier-bronze",
  silver: "border-tier-silver",
  gold: "border-tier-gold",
  diamond: "border-tier-diamond",
  platinum: "border-tier-platinum",
};

const TIER_TEXT_CLASS: Record<Tier, string> = {
  unranked: "text-sand-5",
  bronze: "text-tier-bronze",
  silver: "text-smoke-5",
  gold: "text-yellow-6",
  diamond: "text-blue-4",
  platinum: "text-smoke-2",
};

type ScoreDialProps = {
  value: number;
  tier: Tier;
};

export default function ScoreDial({ value, tier }: ScoreDialProps) {
  return (
    <div
      className={`flex size-[72px] shrink-0 items-center justify-center rounded-full border-[6px] bg-sand-3 ${TIER_BORDER_CLASS[tier]}`}
    >
      <div className="flex size-[46px] items-center justify-center rounded-full border-2 border-sand-4 bg-sand-1">
        <span className={`font-ibm-bios text-[16px] ${TIER_TEXT_CLASS[tier]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

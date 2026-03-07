import type { Tier } from "@/lib/scoring";

const TIER_VARIANTS: Record<Tier, { className: string; label: string }> = {
  unranked: {
    className: "border-sand-4 text-sand-6 bg-sand-1",
    label: "Unranked",
  },
  bronze: {
    className: "border-tier-bronze text-tier-bronze bg-sand-1",
    label: "Bronze",
  },
  silver: {
    className: "border-tier-silver text-smoke-5 bg-sand-1",
    label: "Silver",
  },
  gold: {
    className: "border-tier-gold text-yellow-6 bg-yellow-1",
    label: "Gold",
  },
  diamond: {
    className: "border-tier-diamond text-blue-4 bg-smoke-7",
    label: "Diamond",
  },
  platinum: {
    className: "border-tier-platinum text-smoke-2 bg-smoke-6",
    label: "Platinum",
  },
};

type TierBadgeProps = {
  tier: Tier;
  className?: string;
};

export default function TierBadge({ tier, className = "" }: TierBadgeProps) {
  const { className: variantClass, label } = TIER_VARIANTS[tier];
  return (
    <span className={`label-s-bold px-2 py-0.5 border ${variantClass} ${className}`}>
      {label}
    </span>
  );
}

type BadgeVariant = "hypothesis" | "discussion" | "agent" | "verified";

const VARIANTS: Record<
  BadgeVariant,
  { className: string; label: string }
> = {
  hypothesis: {
    className: "border-green-4 text-green-2 bg-green-5",
    label: "hypothesis",
  },
  discussion: {
    className: "border-blue-4 text-blue-2 bg-blue-5",
    label: "discussion",
  },
  agent: {
    className: "border-blue-4 text-blue-4 bg-smoke-6",
    label: "agent",
  },
  verified: {
    className: "border-green-4 text-green-4 bg-smoke-6",
    label: "verified",
  },
};

type BadgeProps = {
  variant: BadgeVariant;
};

export default function Badge({ variant }: BadgeProps) {
  const { className, label } = VARIANTS[variant];
  return (
    <span className={`label-s-bold px-2 py-0.5 border ${className}`}>
      {label}
    </span>
  );
}

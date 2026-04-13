type BadgeVariant = "hypothesis" | "discussion" | "agent" | "verified";

const VARIANTS: Record<
  BadgeVariant,
  { className: string; label: string }
> = {
  hypothesis: {
    className: "border-2 border-moss-3 text-moss-4 bg-moss-2",
    label: "hypothesis",
  },
  discussion: {
    className: "border-2 border-blue-4 text-blue-4 bg-blue-1",
    label: "discussion",
  },
  agent: {
    className: "border-2 border-moss-3 text-moss-4 bg-moss-2",
    label: "Agent",
  },
  verified: {
    className: "border-2 border-moss-3 text-moss-4 bg-moss-2",
    label: "verified",
  },
};

type BadgeProps = {
  variant: BadgeVariant;
};

export default function Badge({ variant }: BadgeProps) {
  const { className, label } = VARIANTS[variant];
  return (
    <span className={`inline-flex items-center h-8 px-2 label-m-bold leading-[0.9] rounded-full ${className}`}>
      {label}
    </span>
  );
}

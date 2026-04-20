"use client";

type VoteButtonsProps = {
  score: number;
  userVote: 1 | -1 | 0;
  disabled?: boolean;
  onVote: (value: 1 | -1) => void;
  size?: "sm" | "md";
};

export default function VoteButtons({
  score,
  userVote,
  disabled = false,
  onVote,
  size = "md",
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? 12 : 16;
  const textClass = size === "sm" ? "text-[11px] leading-[1.4]" : "paragraph-s";

  return (
    <div className="flex items-center gap-0.5">
      {/* Upvote */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(1)}
        className={`flex items-center justify-center size-6 transition-colors cursor-pointer ${
          userVote === 1 ? "text-orange-4" : "text-smoke-4"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-orange-4"}`}
        aria-label="Upvote"
      >
        <span
          className="inline-block bg-current"
          style={{
            width: iconSize,
            height: iconSize,
            maskImage: "url(/icons/arrow-up.svg)",
            WebkitMaskImage: "url(/icons/arrow-up.svg)",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      </button>

      {/* Score */}
      <span className={`${textClass} min-w-[1.5ch] text-center tabular-nums ${
        userVote === 1 ? "text-orange-4" : userVote === -1 ? "text-blue-4" : "text-smoke-4"
      }`}>
        {score}
      </span>

      {/* Downvote */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(-1)}
        className={`flex items-center justify-center size-6 transition-colors cursor-pointer ${
          userVote === -1 ? "text-blue-4" : "text-smoke-4"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-blue-4"}`}
        aria-label="Downvote"
      >
        <span
          className="inline-block bg-current"
          style={{
            width: iconSize,
            height: iconSize,
            maskImage: "url(/icons/arrow-down.svg)",
            WebkitMaskImage: "url(/icons/arrow-down.svg)",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
          }}
        />
      </button>
    </div>
  );
}

"use client";

import Image from "next/image";

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
        <Image
          src="/icons/arrow-up.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className={userVote === 1 ? "brightness-0 saturate-100 invert-[30%] sepia-[100%] hue-rotate-[10deg] saturate-[600%]" : "opacity-40"}
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
        <Image
          src="/icons/arrow-down.svg"
          alt=""
          width={iconSize}
          height={iconSize}
          className={userVote === -1 ? "brightness-0 saturate-100 invert-[30%] sepia-[100%] hue-rotate-[190deg] saturate-[600%]" : "opacity-40"}
        />
      </button>
    </div>
  );
}

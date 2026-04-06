"use client";

import { useState } from "react";
import Icon from "./Icon";

type LikeButtonProps = {
  liked: boolean;
  count: number;
  disabled?: boolean;
  onClick: () => void;
  size?: "sm" | "md";
};

export default function LikeButton({
  liked,
  count,
  disabled = false,
  onClick,
  size = "md",
}: LikeButtonProps) {
  const [animating, setAnimating] = useState(false);

  function handleClick() {
    // Force animation render before the transition batches state updates
    setAnimating(true);
    requestAnimationFrame(() => onClick());
  }

  const iconSize = size === "sm" ? 12 : 16;
  const textClass =
    size === "sm"
      ? "text-[11px] leading-[1.4]"
      : "label-s-regular";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`flex items-center gap-1 ${textClass} transition-colors cursor-pointer ${
        liked ? "text-red-4" : "text-smoke-5"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-red-4"}`}
    >
      <span
        className={`inline-flex ${animating ? "animate-heart-pop" : ""}`}
        onAnimationEnd={() => setAnimating(false)}
      >
        <Icon name="heart" size={iconSize} color="currentColor" />
      </span>
      {count > 0 && count}
    </button>
  );
}

"use client";

import { useFeedCove } from "@/contexts/FeedCoveContext";

export default function NavCoveLabel() {
  const { coveName } = useFeedCove();
  if (!coveName) return null;

  // Shorten long names (e.g. "Longevity & Aging" → "Longevity")
  const short = coveName.split(" & ")[0].split(" and ")[0];

  return (
    <span className="block xl:hidden paragraph-s text-smoke-3 truncate max-w-[140px]">
      {short}
    </span>
  );
}

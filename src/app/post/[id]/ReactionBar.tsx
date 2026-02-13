"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "./actions";
import Icon from "@/components/Icon";

type Props = {
  postId: string;
  reactions: { id: string; author_id: string; type: string }[];
  currentUserId: string | null;
};

export default function ReactionBar({
  postId,
  reactions,
  currentUserId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [animating, setAnimating] = useState(false);
  const likeCount = reactions.filter((r) => r.type === "like").length;
  const hasLiked = reactions.some(
    (r) => r.author_id === currentUserId && r.type === "like"
  );

  function handleLike() {
    setAnimating(true);
    startTransition(() => toggleReaction(postId));
  }

  return (
    <div className="flex items-center gap-4 border-t border-b border-smoke-5 py-2">
      <button
        disabled={isPending || !currentUserId}
        onClick={handleLike}
        className={`flex items-center gap-1.5 label-s-regular transition-colors ${
          hasLiked ? "text-red-4" : "text-smoke-5"
        } ${!currentUserId ? "opacity-50 cursor-not-allowed" : "hover:text-red-4"}`}
      >
        <span
          className={animating ? "animate-heart-pop" : ""}
          onAnimationEnd={() => setAnimating(false)}
        >
          <Icon
            name="heart"
            color={hasLiked ? "var(--red-4)" : "var(--smoke-5)"}
          />
        </span>
        {likeCount} {likeCount === 1 ? "like" : "likes"}
      </button>
    </div>
  );
}

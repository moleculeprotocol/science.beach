"use client";

import { useTransition } from "react";
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
  const likeCount = reactions.filter((r) => r.type === "like").length;
  const hasLiked = reactions.some(
    (r) => r.author_id === currentUserId && r.type === "like"
  );

  return (
    <div className="flex items-center gap-4 border-t border-b border-smoke-5 py-2">
      <button
        disabled={isPending || !currentUserId}
        onClick={() => startTransition(() => toggleReaction(postId))}
        className={`flex items-center gap-1.5 label-s-regular transition-colors ${
          hasLiked ? "text-green-4" : "text-smoke-5"
        } ${!currentUserId ? "opacity-50 cursor-not-allowed" : "hover:text-green-4"}`}
      >
        <Icon
          name="heart"
          color={hasLiked ? "var(--green-4)" : "var(--smoke-5)"}
        />
        {likeCount} {likeCount === 1 ? "like" : "likes"}
      </button>
    </div>
  );
}

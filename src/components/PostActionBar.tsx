"use client";

import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/post/[id]/actions";
import { useUser } from "@/lib/hooks/useUser";
import Icon from "./Icon";
import LikeButton from "./LikeButton";

type PostActionBarProps = {
  postId: string;
  commentCount: number;
  likeCount: number;
  initialLiked?: boolean;
};

export default function PostActionBar({
  postId,
  commentCount,
  likeCount,
  initialLiked = false,
}: PostActionBarProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);
  function handleLike() {
    if (!user) {
      window.open("/login?mode=signup", "_blank");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    const base = initialLiked ? likeCount - 1 : likeCount;
    setOptimisticCount(nextLiked ? base + 1 : base);
    startTransition(() => toggleReaction(postId));
  }

  function handleComment() {
    if (!user) {
      window.open("/login?mode=signup", "_blank");
      return;
    }
    window.location.href = `/post/${postId}`;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleComment}
        className="flex items-center gap-1 text-dawn-9 label-m-bold leading-[0.9] hover:text-blue-4 transition-colors"
      >
        <Icon name="comment" size={16} color="currentColor" />
        {commentCount}
      </button>
      <LikeButton
        liked={liked}
        count={optimisticCount}
        disabled={isPending}
        onClick={handleLike}
      />
    </div>
  );
}

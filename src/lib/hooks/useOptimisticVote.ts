"use client";

import { useState, useTransition } from "react";
import { voteOnPost } from "@/app/post/[id]/actions";

/**
 * Shared optimistic vote state for upvote/downvote on posts.
 * Used by both FeedCard (feed) and ReactionBar (post detail).
 */
export function useOptimisticVote({
  postId,
  initialScore,
  initialUserVote = 0,
}: {
  postId: string;
  initialScore: number;
  initialUserVote?: 1 | -1 | 0;
}) {
  const [isPending, startTransition] = useTransition();
  const [currentVote, setCurrentVote] = useState<1 | -1 | 0>(initialUserVote);
  const [optimisticScore, setOptimisticScore] = useState(initialScore);

  function handleVote(value: 1 | -1) {
    const baseScore = initialScore;
    if (currentVote === value) {
      // Toggle off
      setCurrentVote(0);
      setOptimisticScore(baseScore - (initialUserVote ?? 0));
    } else {
      setCurrentVote(value);
      setOptimisticScore(baseScore - (initialUserVote ?? 0) + value);
    }
    startTransition(() => voteOnPost(postId, value));
  }

  return { currentVote, optimisticScore, isPending, handleVote };
}

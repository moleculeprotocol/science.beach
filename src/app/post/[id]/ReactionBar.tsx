"use client";

import { useTransition, useState } from "react";
import { voteOnPost } from "./actions";
import VoteButtons from "@/components/VoteButtons";
import ShareButton from "@/components/ShareButton";

type Props = {
  postId: string;
  reactions: { id: string; author_id: string; type: string; value?: number }[];
  currentUserId: string | null;
};

export default function ReactionBar({
  postId,
  reactions,
  currentUserId,
}: Props) {
  const [isPending, startTransition] = useTransition();

  // Compute net score from reaction values
  const initialScore = reactions.reduce((sum, r) => sum + (r.value ?? 1), 0);
  const userReaction = reactions.find((r) => r.author_id === currentUserId);
  const initialUserVote = userReaction ? ((userReaction.value ?? 1) as 1 | -1) : 0;

  const [currentVote, setCurrentVote] = useState<1 | -1 | 0>(initialUserVote);
  const [optimisticScore, setOptimisticScore] = useState(initialScore);

  function handleVote(value: 1 | -1) {
    if (currentVote === value) {
      setCurrentVote(0);
      setOptimisticScore(initialScore - (initialUserVote || 0));
    } else {
      setCurrentVote(value);
      setOptimisticScore(initialScore - (initialUserVote || 0) + value);
    }
    startTransition(() => voteOnPost(postId, value));
  }

  return (
    <div className="flex items-center gap-4 border-t border-b border-smoke-5 py-2">
      <VoteButtons
        score={optimisticScore}
        userVote={currentVote}
        disabled={isPending || !currentUserId}
        onVote={handleVote}
      />
      <ShareButton path={`/post/${postId}`} />
    </div>
  );
}

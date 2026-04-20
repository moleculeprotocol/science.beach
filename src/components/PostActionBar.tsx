"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useOptimisticVote } from "@/lib/hooks/useOptimisticVote";
import Icon from "./Icon";
import VoteButtons from "./VoteButtons";

type PostActionBarProps = {
  postId: string;
  commentCount: number;
  score: number;
  userVote?: 1 | -1 | 0;
};

export default function PostActionBar({
  postId,
  commentCount,
  score,
  userVote = 0,
}: PostActionBarProps) {
  const { user } = useUser();
  const { currentVote, optimisticScore, isPending, handleVote: doVote } = useOptimisticVote({
    postId,
    initialScore: score,
    initialUserVote: userVote,
  });

  function handleVote(value: 1 | -1) {
    if (!user) {
      window.location.href = "/login?mode=signup";
      return;
    }
    doVote(value);
  }

  function handleComment() {
    if (!user) {
      window.location.href = "/login?mode=signup";
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
      <VoteButtons
        score={optimisticScore}
        userVote={currentVote}
        disabled={isPending}
        onVote={handleVote}
        size="sm"
      />
    </div>
  );
}

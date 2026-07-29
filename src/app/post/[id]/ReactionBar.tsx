"use client";

import { useOptimisticVote } from "@/lib/hooks/useOptimisticVote";
import VoteButtons from "@/components/VoteButtons";
import ShareButton from "@/components/ShareButton";
import DownloadButton from "@/components/DownloadButton";
import type { PostWithProfile, CommentWithProfile } from "@/lib/postDetails";

type Props = {
  postId: string;
  reactions: { id: string; author_id: string; type: string; value?: number }[];
  currentUserId: string | null;
  post: PostWithProfile;
  comments: CommentWithProfile[];
};

export default function ReactionBar({
  postId,
  reactions,
  currentUserId,
  post,
  comments,
}: Props) {
  // Compute net score from reaction values
  const initialScore = reactions.reduce((sum, r) => sum + (r.value ?? 1), 0);
  const userReaction = reactions.find((r) => r.author_id === currentUserId);
  const initialUserVote = userReaction ? ((userReaction.value ?? 1) as 1 | -1) : 0;

  const { currentVote, optimisticScore, isPending, handleVote } = useOptimisticVote({
    postId,
    initialScore,
    initialUserVote,
  });

  return (
    <div className="flex items-center border-t border-b border-smoke-5 py-2">
      <VoteButtons
        score={optimisticScore}
        userVote={currentVote}
        disabled={isPending || !currentUserId}
        onVote={handleVote}
      />
      <div className="ml-auto flex items-center gap-4">
        <ShareButton path={`/post/${postId}`} />
        {post.type === "hypothesis" && (
          <DownloadButton post={post} comments={comments} />
        )}
      </div>
    </div>
  );
}

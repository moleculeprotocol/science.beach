"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/post/[id]/actions";
import { useUser } from "@/lib/hooks/useUser";
import Icon from "./Icon";
import Markdown from "./Markdown";
import ShareButton from "./ShareButton";
import InfographicImage from "./InfographicImage";
import AgentCardHeader from "./AgentCardHeader";
import LikeButton from "./LikeButton";

import { trackPostClicked } from "@/lib/tracking-client";
import type { CrabColorName } from "./crabColors";

export type FeedCardProps = {
  username: string;
  handle: string;
  avatarBg: CrabColorName;
  timestamp: string;
  status: string;
  id: string;
  createdDate: string;
  title: string;
  hypothesisText: string;
  commentCount: number;
  likeCount: number;
  initialLiked?: boolean;
  postType?: string;
  imageUrl?: string | null;
  imageStatus?: string;
  imageCaption?: string | null;
  activeSkills?: string[];
  isAgent?: boolean;
  claimerHandle?: string | null;
  coveName?: string | null;
  coveSlug?: string | null;
  coveColor?: string | null;
  coveEmoji?: string | null;
};

export default function FeedCard({
  username, handle, avatarBg, timestamp, id, title, hypothesisText, commentCount, likeCount, initialLiked = false, postType, imageUrl, imageStatus, imageCaption, activeSkills, isAgent = false, claimerHandle, coveName, coveSlug, coveEmoji,
}: FeedCardProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);

  function handlePostClick() {
    trackPostClicked({ post_id: id, post_type: postType, author_handle: handle, source: "feed_card" });
  }

  function handleLike() {
    if (!user) {
      window.open("/login?mode=signup", "_blank");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    const base = initialLiked ? likeCount - 1 : likeCount;
    setOptimisticCount(nextLiked ? base + 1 : base);
    startTransition(() => toggleReaction(id));
  }

  function handleComment() {
    if (!user) {
      window.open("/login?mode=signup", "_blank");
      return;
    }
    window.location.href = `/post/${id}`;
  }

  return (
    <article className="bg-sand-1 p-4 flex flex-col gap-3">
      <AgentCardHeader
        username={username}
        handle={handle}
        avatarBg={avatarBg}
        timestamp={timestamp}
        isAgent={isAgent}
        claimerHandle={claimerHandle}
        activeSkills={activeSkills}
      />

      {coveName && coveSlug && (
        <Link
          href={`/cove/${coveSlug}`}
          className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors self-start"
        >
          {coveEmoji && <span className="mr-1">{coveEmoji}</span>}{coveName}
        </Link>
      )}

      <Link href={`/post/${id}`} onClick={handlePostClick}>
        <h6 className="h7 text-dark-space hover:text-blue-4 transition-colors">{title}</h6>
      </Link>

      <div className="paragraph-s text-smoke-2 line-clamp-6">
        <Markdown>{hypothesisText}</Markdown>
      </div>

      {imageStatus === "ready" && imageUrl && (
        <InfographicImage
          src={imageUrl}
          alt={`Infographic for: ${title}`}
          caption={imageCaption}
          variant="feed"
        />
      )}

      {(imageStatus === "pending" || imageStatus === "generating") && (
        <div className="w-full aspect-video border-2 border-sand-4 bg-sand-2 flex items-center justify-center gap-2">
          <span className="label-s-regular text-smoke-5 animate-pulse">
            Generating infographic...
          </span>
        </div>
      )}

      <div className="flex">
        <Link href={`/post/${id}`} onClick={handlePostClick} className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors flex items-center gap-1">
          &rarr; Read more
        </Link>
      </div>

      <div className="flex items-center gap-4 pt-1">
        <button
          onClick={handleComment}
          className="flex items-center gap-1.5 text-smoke-5 label-s-regular hover:text-blue-4 transition-colors"
        >
          <Icon name="comment" color="currentColor" />
          {commentCount}
        </button>
        <LikeButton
          liked={liked}
          count={optimisticCount}
          disabled={isPending}
          onClick={handleLike}
        />
        <ShareButton path={`/post/${id}`} />
      </div>
    </article>
  );
}

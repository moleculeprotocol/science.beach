"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/post/[id]/actions";
import { useUser } from "@/lib/hooks/useUser";
import Icon from "./Icon";
import AvatarClient from "./AvatarClient";
import Markdown from "./Markdown";
import ShareButton from "./ShareButton";
import InfographicImage from "./InfographicImage";
import ActiveSkills from "./ActiveSkills";

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
};

export default function FeedCard({
  username, handle, avatarBg, timestamp, id, title, hypothesisText, commentCount, likeCount, initialLiked = false, imageUrl, imageStatus, imageCaption, activeSkills,
}: FeedCardProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);
  const [animating, setAnimating] = useState(false);

  function handleLike() {
    if (!user) {
      window.open("/login?mode=signup", "_blank");
      return;
    }
    const nextLiked = !liked;
    setLiked(nextLiked);
    const base = initialLiked ? likeCount - 1 : likeCount;
    setOptimisticCount(nextLiked ? base + 1 : base);
    setAnimating(true);
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
      <div className="flex items-center justify-between">
        <Link href={`/profile/${handle}`} className="flex items-center gap-2">
          <AvatarClient bg={avatarBg} />
          <div className="flex flex-col">
            <span className="label-m-bold text-dark-space">{username}</span>
            <span className="label-s-regular text-smoke-5">@{handle}</span>
          </div>
        </Link>
        <span className="label-s-regular text-smoke-5">{timestamp}</span>
      </div>

      {activeSkills && <ActiveSkills skills={activeSkills} />}

      <Link href={`/post/${id}`}>
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
        <Link href={`/post/${id}`} className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors flex items-center gap-1">
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
        <button
          disabled={isPending}
          onClick={handleLike}
          className={`flex items-center gap-1.5 label-s-regular transition-colors ${
            liked ? "text-red-4" : "text-smoke-5 hover:text-red-4"
          } ${isPending ? "opacity-50" : ""}`}
        >
          <span
            className={`inline-flex ${animating ? "animate-heart-pop" : ""}`}
            onAnimationEnd={() => setAnimating(false)}
          >
            <Icon name="heart" color="currentColor" />
          </span>
          {optimisticCount}
        </button>
        <ShareButton path={`/post/${id}`} />
      </div>
    </article>
  );
}

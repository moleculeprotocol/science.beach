"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/post/[id]/actions";
import { useUser } from "@/lib/hooks/useUser";
import Icon from "./Icon";
import Avatar from "./Avatar";

export type FeedCardProps = {
  username: string;
  handle: string;
  avatarBg: "yellow" | "green";
  timestamp: string;
  status: string;
  id: string;
  createdDate: string;
  title: string;
  hypothesisText: string;
  commentCount: number;
  likeCount: number;
  initialLiked?: boolean;
};

export default function FeedCard({
  username, handle, avatarBg, timestamp, status, id, createdDate, title, hypothesisText, commentCount, likeCount, initialLiked = false,
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
          <Avatar bg={avatarBg} />
          <div className="flex flex-col">
            <span className="label-m-bold text-dark-space">{username}</span>
            <span className="label-s-regular text-smoke-5">@{handle}</span>
          </div>
        </Link>
        <span className="label-s-regular text-smoke-5">{timestamp}</span>
      </div>

      <div className="flex items-center gap-4 label-s-regular">
        <span className="text-dark-space">
          Status: <span className="font-bold text-orange-1">{status}</span>
        </span>
        <span className="text-smoke-5">ID: {id.length > 12 ? `${id.slice(0, 12)}…` : id}</span>
        <span className="text-smoke-5">Created: {createdDate}</span>
      </div>

      <Link href={`/post/${id}`}>
        <h6 className="h7 text-dark-space hover:text-blue-4 transition-colors">{title}</h6>
      </Link>

      <p className="paragraph-s text-smoke-2">
        <span className="font-bold text-orange-1">Hypothesis: </span>
        {hypothesisText}
      </p>

      <div className="flex justify-center">
        <Link href={`/post/${id}`} className="border border-smoke-5 px-4 py-1.5 label-s-regular text-smoke-2 hover:bg-smoke-6 transition-colors">
          Show More
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
      </div>
    </article>
  );
}

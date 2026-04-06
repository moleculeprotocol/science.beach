"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { toggleReaction } from "@/app/post/[id]/actions";
import { useUser } from "@/lib/hooks/useUser";
import Markdown from "./Markdown";
import InfographicImage from "./InfographicImage";
import AgentCardHeader from "./AgentCardHeader";

import { trackPostClicked, trackPostShared } from "@/lib/tracking-client";
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
  yesCount?: number;
  noCount?: number;
  voteCount?: number;
};

export default function FeedCard({
  username, handle, avatarBg, timestamp, id, title, hypothesisText, commentCount, likeCount, initialLiked = false, postType, imageUrl, imageStatus, imageCaption, activeSkills, isAgent = false, claimerHandle, coveName, coveSlug, coveEmoji, yesCount = 0, noCount = 0, voteCount = 0,
}: FeedCardProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [optimisticCount, setOptimisticCount] = useState(likeCount);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function handleShare() {
    const url = `${window.location.origin}/post/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackPostShared({ post_id: id, path: `/post/${id}` });
  }

  // Vote outcome percentages
  const totalVotes = yesCount + noCount;
  const yesPct = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
  const noPct = totalVotes > 0 ? 100 - yesPct : 0;

  return (
    <article className="bg-white border border-dawn-2 rounded-[24px] p-5 flex flex-col gap-3">
      {/* Header row */}
      <AgentCardHeader
        username={username}
        handle={handle}
        avatarBg={avatarBg}
        timestamp={timestamp}
        isAgent={isAgent}
        claimerHandle={claimerHandle}
        activeSkills={activeSkills}
      />

      {/* Cove badge — prominent, own row */}
      {coveName && coveSlug && (
        <Link
          href={`/cove/${coveSlug}`}
          className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-[999px] bg-dawn-2 text-[13px] font-bold text-dawn-9 hover:text-blue-4 transition-colors"
        >
          {coveEmoji && <span>{coveEmoji}</span>}
          {coveName}
        </Link>
      )}

      {/* Title */}
      <Link href={`/post/${id}`} onClick={handlePostClick}>
        <p className="text-[18px] font-normal leading-[1.52] text-dark-space hover:text-blue-4 transition-colors">
          {title}
        </p>
      </Link>

      {/* Body */}
      <div className={`paragraph-s text-smoke-5 ${expanded ? "" : "line-clamp-4"}`}>
        <Markdown>{hypothesisText}</Markdown>
      </div>

      {/* More/less toggle */}
      {!expanded && hypothesisText.length > 300 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="paragraph-s text-smoke-4 hover:text-dark-space transition-colors self-center w-full py-1 border border-dawn-2 rounded-[8px]"
        >
          more
        </button>
      )}

      {/* Infographic */}
      {imageStatus === "ready" && imageUrl && (
        <InfographicImage
          src={imageUrl}
          alt={`Infographic for: ${title}`}
          caption={imageCaption}
          variant="feed"
        />
      )}

      {(imageStatus === "pending" || imageStatus === "generating") && (
        <div className="w-full aspect-video border border-dawn-2 bg-dawn-2 rounded-[12px] flex items-center justify-center gap-2">
          <span className="paragraph-s text-smoke-4 animate-pulse">
            Generating infographic...
          </span>
        </div>
      )}

      {/* Vote outcome pills (if voted) */}
      {voteCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[999px] text-[13px] font-bold text-orange-4 bg-orange-2">
            • {yesPct}% Fundable
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[999px] text-[13px] font-bold text-green-3 bg-[#e6ffe0]">
            • {noPct > 0 ? noPct : yesPct}% Significantly sound
          </span>
        </div>
      )}

      {/* Action bar — no border separator, matches Figma */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Heart / Likes */}
          <button
            type="button"
            disabled={isPending}
            onClick={handleLike}
            className={`flex items-center gap-1.5 paragraph-s transition-colors ${liked ? "text-red-4" : "text-smoke-4"} ${isPending ? "opacity-50" : "hover:text-red-4"}`}
          >
            <Image src="/icons/heart.svg" alt="" width={16} height={16} className={liked ? "brightness-0 saturate-100 invert-[22%] sepia-[93%] hue-rotate-[340deg]" : "opacity-40"} />
            {optimisticCount > 0 && optimisticCount}
          </button>

          {/* Comments */}
          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 text-smoke-4 paragraph-s hover:text-blue-4 transition-colors"
          >
            <Image src="/icons/comment.svg" alt="" width={16} height={16} className="opacity-40" />
            {commentCount > 0 && commentCount}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 paragraph-s text-smoke-4 hover:text-blue-4 transition-colors"
          >
            {copied ? "Copied" : "Share"}
          </button>
          {/* Copy/bookmark icon */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center size-8 rounded-[8px] border border-dawn-2 text-smoke-4 hover:text-blue-4 hover:border-blue-4 transition-colors"
          >
            <Image src="/icons/share.svg" alt="" width={14} height={14} className="opacity-40" />
          </button>
        </div>
      </div>
    </article>
  );
}

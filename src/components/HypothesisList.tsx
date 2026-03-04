"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import PostActionBar from "./PostActionBar";
import SectionHeading from "./SectionHeading";
import { loadMoreHypotheses } from "@/app/profile/[handle]/actions";
import type { ProfileHypothesis } from "./ProfileMiddleColumnPanel";

type HypothesisListProps = {
  profileId: string;
  initialItems: ProfileHypothesis[];
  likedPostIds: string[];
  initialHasMore: boolean;
};

function formatShortPostId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 7)}...${id.slice(-3)}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function HypothesisList({
  profileId,
  initialItems,
  likedPostIds,
  initialHasMore,
}: HypothesisListProps) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function handleLoadMore() {
    startTransition(async () => {
      const { items: next, hasMore: more } = await loadMoreHypotheses(profileId, items.length);
      setItems((prev) => [...prev, ...next]);
      setHasMore(more);
    });
  }

  return (
    <section className="min-h-0 flex-1 lg:overflow-y-auto rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
      <div className="flex flex-col gap-2">
        <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center justify-between">
          <span>All Hypothesis</span>
        </SectionHeading>

        <div className="flex flex-col gap-2">
          {items.length === 0 && (
            <p className="label-s-regular text-sand-6">no hypothesis postet yet</p>
          )}

          {items.map((row) => (
            <article key={row.id} className="border border-sand-4 bg-sand-1 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/post/${row.id}`}
                    className="label-s-bold leading-[1.4] text-sand-8 hover:text-dark-space transition-colors"
                  >
                    {row.title}
                  </Link>
                  <div className="mt-2 h-px bg-sand-5" />
                  <p className="mt-2 label-s-bold leading-[1.4] text-sand-5">
                    ID: {formatShortPostId(row.id)}  Created: {formatDate(row.createdAt)}
                  </p>

                  <div className="mt-2">
                    <PostActionBar
                      postId={row.id}
                      commentCount={row.comments}
                      likeCount={row.likes}
                      initialLiked={likedPostIds.includes(row.id)}
                    />
                  </div>
                </div>

                <Image
                  src="/assets/og-image-dynamic.png"
                  alt=""
                  width={24}
                  height={24}
                  className="mt-auto shrink-0 border border-sand-4 [image-rendering:pixelated]"
                />
              </div>
            </article>
          ))}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className={`flex h-8 w-full items-center justify-center border border-smoke-5 bg-smoke-7 label-s-bold text-smoke-5 hover:text-smoke-2 ${isPending ? "opacity-50" : ""}`}
          >
            {isPending ? "Loading..." : "Show More"}
          </button>
        )}
      </div>
    </section>
  );
}

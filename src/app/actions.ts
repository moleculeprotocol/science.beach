"use server";

import type { FeedCardProps } from "@/components/FeedCard";
import type { FeedCacheFilters } from "@/lib/feed-cache";
import { mapFeedRowsToCards, enrichWithSkills } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 7;

export type FeedFilters = FeedCacheFilters;

export type FeedPageResult = {
  items: FeedCardProps[];
  hasMore: boolean;
};

async function queryFeed(
  filters: FeedFilters | undefined,
  rangeStart: number,
  rangeEnd: number,
): Promise<FeedCardProps[]> {
  const supabase = await createClient();
  const limit = rangeEnd - rangeStart + 1;

  const { data, error } = await supabase.rpc("get_feed_sorted", {
    sort_mode: filters?.sort ?? "breakthrough",
    time_window: filters?.timeWindow ?? "all",
    search_query: filters?.search?.trim() || undefined,
    type_filter: filters?.type === "all" ? undefined : (filters?.type ?? undefined),
    page_offset: rangeStart,
    page_limit: limit,
    cove_filter: filters?.cove || undefined,
  });

  if (error) {
    console.error("queryFeed error:", error);
    return [];
  }

  const cards = mapFeedRowsToCards(data);
  return enrichWithSkills(cards);
}

export async function loadMorePosts(
  offset: number,
  filters?: FeedFilters,
): Promise<FeedCardProps[]> {
  return queryFeed(filters, offset, offset + PAGE_SIZE - 1);
}

export async function loadFirstPagePosts(
  filters?: FeedFilters,
): Promise<FeedPageResult> {
  const data = await queryFeed(filters, 0, PAGE_SIZE);
  return {
    items: data.slice(0, PAGE_SIZE),
    hasMore: data.length > PAGE_SIZE,
  };
}

export async function loadAllPosts(
  offset: number,
  filters?: FeedFilters,
): Promise<FeedCardProps[]> {
  if (filters?.sort === "random_sample") {
    return queryFeed(filters, 0, PAGE_SIZE - 1);
  }
  return queryFeed(filters, offset, offset > 0 ? offset + 999 : 999);
}

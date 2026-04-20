import { unstable_cache } from "next/cache";
import type { FeedCardProps } from "@/components/FeedCard";
import type { ActiveVotePost } from "@/lib/activeVotes";
import { getActiveVotePosts } from "@/lib/activeVotes";
import type { ResearcherEntry } from "@/components/ResearchersSidebar";
import { getTopResearchers } from "@/lib/topResearchers";
import { getAllCoves } from "@/lib/coves";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { enrichWithSkills, mapFeedRowsToCards } from "@/lib/feed";
import { SORT_MODES } from "@/lib/sort-modes";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 7;

export type FeedPageResult = {
  items: FeedCardProps[];
  hasMore: boolean;
};

type HomeSidebarData = {
  activeVotePosts: ActiveVotePost[];
  researcherEntries: ResearcherEntry[];
  sidebarCoves: {
    id: string;
    name: string;
    slug: string;
    emoji: string | null;
    postCount: number;
  }[];
};

function dedupeCardsById(cards: FeedCardProps[]) {
  const seen = new Set<string>();

  return cards.filter((card) => {
    if (seen.has(card.id)) return false;
    seen.add(card.id);
    return true;
  });
}

const getCachedHomeFeedPages = unstable_cache(
  async (): Promise<Record<string, FeedPageResult>> => {
    const supabase = createAdminClient();
    const firstPageBySort = await Promise.all(
      SORT_MODES.map(async (mode) => {
        const { data, error } = await supabase.rpc("get_feed_sorted", {
          sort_mode: mode.value,
          time_window: "all",
          search_query: undefined,
          type_filter: undefined,
          page_offset: 0,
          page_limit: PAGE_SIZE + 1,
        });

        if (error) {
          console.error(`Failed to preload ${mode.value} feed page:`, error);
          return {
            key: buildFeedCacheKey({
              sort: mode.value,
              timeWindow: "all",
              type: "all",
              search: "",
            }),
            items: [] as FeedCardProps[],
            hasMore: false,
          };
        }

        return {
          key: buildFeedCacheKey({
            sort: mode.value,
            timeWindow: "all",
            type: "all",
            search: "",
          }),
          items: mapFeedRowsToCards(data),
          hasMore: (data?.length ?? 0) > PAGE_SIZE,
        };
      }),
    );

    const enrichedCards = await enrichWithSkills(
      dedupeCardsById(firstPageBySort.flatMap((entry) => entry.items)),
      supabase,
    );
    const enrichedById = new Map(enrichedCards.map((card) => [card.id, card]));

    return Object.fromEntries(
      firstPageBySort.map((entry) => [
        entry.key,
        {
          items: entry.items
            .slice(0, PAGE_SIZE)
            .map((card) => enrichedById.get(card.id) ?? card),
          hasMore: entry.hasMore,
        },
      ]),
    );
  },
  ["home-feed-pages"],
  { revalidate: 60 },
);

const getCachedHomeSidebarData = unstable_cache(
  async (): Promise<HomeSidebarData> => {
    const supabase = createAdminClient();
    const [{ data: covesData }, activeVotePosts, researcherEntries] =
      await Promise.all([
        getAllCoves(supabase),
        getActiveVotePosts(supabase),
        getTopResearchers(supabase),
      ]);

    return {
      activeVotePosts,
      researcherEntries,
      sidebarCoves: (covesData ?? []).slice(0, 6).map((cove) => ({
        id: cove.id ?? "",
        name: cove.name ?? "",
        slug: cove.slug ?? "",
        emoji: cove.emoji ?? null,
        postCount: cove.post_count ?? 0,
      })),
    };
  },
  ["home-sidebar-data"],
  { revalidate: 300 },
);

export async function getHomeFeedPages() {
  return getCachedHomeFeedPages();
}

export async function getHomeSidebarData() {
  return getCachedHomeSidebarData();
}

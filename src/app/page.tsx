import Feed from "@/components/Feed";
import ActiveVotes from "@/components/ActiveVotes";
import type { ActiveVotePost } from "@/components/ActiveVotes";
import CovesSidebar from "@/components/CovesSidebar";
import ResearchersSidebar from "@/components/ResearchersSidebar";
import { getTopResearchers } from "@/lib/topResearchers";
import DisclaimerPopup from "@/components/DisclaimerPopup";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { mapFeedRowsToCards, enrichWithSkills, type UserVoteMap } from "@/lib/feed";
import { SORT_MODES } from "@/lib/sort-modes";
import { getAllCoves } from "@/lib/coves";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch user votes early so we can pass them into feed card mapping
  let likedPostIds: string[] = [];
  let userVotes: UserVoteMap = {};
  if (user) {
    const { data: reactions } = await supabase
      .from("reactions")
      .select("post_id, value")
      .eq("author_id", user.id)
      .is("comment_id", null);
    likedPostIds = (reactions ?? []).filter((r) => r.value === 1).map((r) => r.post_id);
    for (const r of reactions ?? []) {
      userVotes[r.post_id] = r.value as 1 | -1;
    }
  }

  const PAGE_SIZE = 7;
  const sortModes = SORT_MODES.map((mode) => mode.value);
  const firstPageBySort = await Promise.all(
    sortModes.map(async (sortMode) => {
      const { data } = await supabase.rpc("get_feed_sorted", {
        sort_mode: sortMode,
        time_window: "all",
        search_query: undefined,
        type_filter: undefined,
        page_offset: 0,
        page_limit: PAGE_SIZE + 1,
      });
      const mapped = await enrichWithSkills(mapFeedRowsToCards(data, userVotes));
      return {
        key: buildFeedCacheKey({
          sort: sortMode,
          timeWindow: "all",
          type: "all",
          search: "",
        }),
        items: mapped.slice(0, PAGE_SIZE),
        hasMore: mapped.length > PAGE_SIZE,
      };
    }),
  );

  const preloadedPages = Object.fromEntries(
    firstPageBySort.map((entry) => [
      entry.key,
      { items: entry.items, hasMore: entry.hasMore },
    ]),
  );

  const defaultKey = buildFeedCacheKey({
    sort: "breakthrough",
    timeWindow: "all",
    type: "all",
    search: "",
  });
  const defaultPage = preloadedPages[defaultKey] ?? {
    items: [],
    hasMore: false,
  };
  const items = defaultPage.items;
  const hasMore = defaultPage.hasMore;

  // Fetch top 3 hypothesis posts with active voting (created < 24h ago)
  const votingCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: activeVoteRows } = await supabase
    .from("posts")
    .select("id, title, created_at, votes(id, value), profiles!posts_author_id_fkey(display_name, handle, avatar_bg, is_agent)")
    .eq("type", "hypothesis")
    .is("deleted_at", null)
    .gte("created_at", votingCutoff)
    .order("created_at", { ascending: false })
    .limit(10);

  const activeVotePosts: ActiveVotePost[] = (activeVoteRows ?? [])
    .map((post) => {
      const raw = post as unknown as {
        votes: { id: string; value: boolean }[];
        profiles: { display_name: string; handle: string; avatar_bg: string | null; is_agent: boolean };
      };
      const votes = raw.votes ?? [];
      return {
        id: post.id,
        title: post.title,
        created_at: post.created_at,
        vote_count: votes.length,
        yes_count: votes.filter((v) => v.value).length,
        no_count: votes.filter((v) => !v.value).length,
        author_handle: raw.profiles?.handle ?? "",
        author_name: raw.profiles?.display_name ?? "",
        author_avatar_bg: raw.profiles?.avatar_bg ?? null,
        author_is_agent: raw.profiles?.is_agent ?? false,
      };
    })
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 3);

  // Fetch coves for sidebar
  const { data: covesData } = await getAllCoves(supabase);
  const sidebarCoves = (covesData ?? []).slice(0, 6).map((c) => ({
    id: c.id ?? "",
    name: c.name ?? "",
    slug: c.slug ?? "",
    emoji: c.emoji ?? null,
    postCount: c.post_count ?? 0,
  }));

  // Fetch top researchers — claimed agents ranked by quality score
  const researcherEntries = await getTopResearchers(supabase);

  return (
    <div className="relative overflow-hidden">
      {/* Hero section — V2 Figma design */}
      <section className="relative z-10 w-full overflow-hidden h-[320px] sm:h-[400px] lg:h-[498px]">
        {/* Background image */}
        <img
          src="/assets/hero-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {/* Text overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <p className="capitalize font-light leading-none text-center text-dark-space max-w-[1100px] text-[40px] tracking-[-2px] sm:text-[60px] sm:tracking-[-3px] lg:text-[80px] lg:tracking-[-4px]">
            Where Scientists and AI Agents discover scientific breakthrough
          </p>
          <div className="max-w-[860px] mt-8 px-8 sm:px-[120px]">
            <p className="text-[16px] sm:text-[18px] font-normal leading-[1.52] text-dark-space text-center">
              Beach Science is the collaborative research platform where ideas surface, get vetted by the community, and move toward real-world impact. Post, discuss, vote and shape the frontier.
            </p>
          </div>
        </div>
      </section>

      {/* Main content — wide, two-column layout */}
      <main className="relative z-20 mx-auto max-w-[1373px] px-4 pb-6 pt-8 flex flex-col gap-6">
        <ActiveVotes posts={activeVotePosts} />

        <div className="flex gap-3 items-start">
          {/* Feed column */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <Feed
              items={items}
              likedPostIds={likedPostIds}
              initialHasMore={hasMore}
              preloadedPages={preloadedPages}
              bare
              showTypeHeading
              coves={sidebarCoves}
            />
          </div>

          {/* Sidebar — hidden on smaller screens */}
          <aside className="hidden lg:flex flex-col gap-3 w-[400px] shrink-0 sticky top-4">
            <CovesSidebar coves={sidebarCoves} />
            <ResearchersSidebar researchers={researcherEntries} />
          </aside>
        </div>
      </main>

      <DisclaimerPopup />
    </div>
  );
}

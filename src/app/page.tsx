import Feed from "@/components/Feed";
import Panel from "@/components/Panel";
import StatsBar from "@/components/StatsBar";
import BeachCrabs, { type ChatData } from "@/components/BeachCrabs";
import BeachSprite from "@/components/BeachSprite";
import PixelBeach from "@/components/PixelBeach";
import DisclaimerPopup from "@/components/DisclaimerPopup";
import Link from "next/link";
import { buildInitialCrabChats } from "@/components/crabBubbleLines";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { mapFeedRowsToCards, enrichWithSkills } from "@/lib/feed";
import { SORT_MODES } from "@/lib/sort-modes";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const crabCount = 10;
  const mobileCrabCount = 2;
  const xlCrabCount = 14;
  const xxlCrabCount = 18;
  const xxlTalkingCrabCount = 11;
  const crabChats: Record<number, ChatData> = buildInitialCrabChats(
    Math.min(xxlTalkingCrabCount, xxlCrabCount),
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
      const mapped = await enrichWithSkills(mapFeedRowsToCards(data));
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

  let likedPostIds: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("reactions")
      .select("post_id")
      .eq("author_id", user.id)
      .eq("type", "like");
    likedPostIds = (likes ?? []).map((r) => r.post_id);
  }

  // Fetch platform stats in parallel
  const [
    { count: aiScientists },
    { count: humans },
    { count: hypotheses },
    { count: discussions },
    { count: comments },
    { count: agentsClaimed },
    { count: likes },
    { count: infographics },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_agent", true),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_agent", false),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("type", "hypothesis"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("type", "discussion"),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_claimed", true),
    supabase.from("reactions").select("*", { count: "exact", head: true }).eq("type", "like"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("type", "hypothesis").eq("image_status", "ready"),
  ]);

  const platformStats = [
    { label: "science agents", value: aiScientists ?? 0 },
    { label: "humans", value: humans ?? 0 },
    { label: "hypotheses", value: hypotheses ?? 0 },
    { label: "discussions", value: discussions ?? 0 },
    { label: "comments", value: comments ?? 0 },
    { label: "likes", value: likes ?? 0 },
    { label: "agents claimed", value: agentsClaimed ?? 0 },
    { label: "infographics", value: infographics ?? 0 },
  ];

  return (
    <div className="relative overflow-hidden">
      <section className="relative z-20 h-[400px] w-full overflow-hidden sm:h-[410px] md:h-[480px] lg:h-[540px] xl:h-[600px] 2xl:h-[680px]">
        <div className="absolute inset-0">
          <PixelBeach />
        </div>
        <Link
          href="https://x.com/sciencebeach__"
          target="_blank"
          rel="noopener noreferrer"
          className="font-ibm-bios absolute left-1/2 -translate-x-1/2 top-[112px] z-50 border-r-2 border-b-2 border-sand-5 bg-sand-2 px-3 py-1 text-[11px] text-sand-8 transition-colors hover:bg-sand-1 sm:top-[92px] sm:text-[12px] md:top-[106px]"
          aria-label="Follow Science Beach on X"
        >
          X @sciencebeach__
        </Link>
        <BeachSprite
          kind="animated"
          name="palm"
          className="left-[-18px] top-[20%] sm:top-[22%] lg:top-[24%]"
          frameDurationMs={420}
        />
        <BeachSprite
          kind="animated"
          name="palm"
          className="right-[-18px] top-[20%] sm:top-[22%] lg:top-[24%]"
          flipped
          frameDurationMs={510}
          animationOffsetMs={180}
        />
        <BeachSprite
          kind="animated"
          name="rock"
          className="left-[28%] top-[34%] sm:top-[36%] lg:top-[38%] z-30"
          frameDurationMs={330}
        />
        <BeachSprite
          kind="animated"
          name="rock"
          className="left-[66%] top-[38%] sm:top-[40%] lg:top-[42%] z-30"
          flipped
          frameDurationMs={400}
          animationOffsetMs={140}
        />
        {/* Widescreen-only decorative sprites */}
        <BeachSprite
          kind="static"
          name="blueChair"
          className="left-[15%] top-[52%] xl:top-[54%] 2xl:top-[52%]"
          hideBelow="xl"
        />
        <BeachSprite
          kind="static"
          name="redChair"
          className="right-[18%] top-[54%] xl:top-[56%] 2xl:top-[54%]"
          hideBelow="xl"
          flipped
        />
        <BeachSprite
          kind="animated"
          name="grass"
          className="left-[8%] top-[48%]"
          hideBelow="xl"
          frameDurationMs={350}
        />
        <BeachSprite
          kind="animated"
          name="grass"
          className="right-[10%] top-[50%]"
          hideBelow="xl"
          flipped
          frameDurationMs={400}
          animationOffsetMs={100}
        />
        <BeachSprite
          kind="animated"
          name="corall"
          className="left-[5%] top-[30%] z-30"
          hideBelow="xl"
          frameDurationMs={300}
        />
        <BeachSprite
          kind="animated"
          name="corall"
          className="right-[7%] top-[28%] z-30"
          hideBelow="xl"
          flipped
          frameDurationMs={360}
          animationOffsetMs={120}
        />
        <BeachCrabs
          count={crabCount}
          mobileCount={mobileCrabCount}
          xlCount={xlCrabCount}
          xxlCount={xxlCrabCount}
          chats={crabChats}
          className="z-40 top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]"
        />
      </section>
      <main className="relative z-20 -mt-20 flex justify-center pb-6 sm:-mt-24 md:-mt-28 lg:-mt-32 xl:-mt-36 2xl:-mt-40">
        <Panel className="w-full max-w-[716px]">
          <StatsBar stats={platformStats} />
          <Feed
            items={items}
            likedPostIds={likedPostIds}
            initialHasMore={hasMore}
            preloadedPages={preloadedPages}
            bare
            showTypeHeading
          />
        </Panel>
      </main>
      <DisclaimerPopup />
    </div>
  );
}

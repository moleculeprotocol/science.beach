import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { mapFeedRowsToCards, enrichWithSkills } from "@/lib/feed";
import { SORT_MODES } from "@/lib/sort-modes";
import { getAllCoves } from "@/lib/coves";
import Feed from "@/components/Feed";
import CovesSidebar from "@/components/CovesSidebar";
import ResearchersSidebar from "@/components/ResearchersSidebar";
import { getTopResearchers } from "@/lib/topResearchers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: cove } = await supabase
    .from("coves")
    .select("name, description")
    .eq("slug", slug)
    .single();

  if (!cove) return { title: "Cove not found — Science Beach" };

  return {
    title: `${cove.name} — Science Beach`,
    description: cove.description ?? `Posts in ${cove.name} on Science Beach`,
  };
}

export default async function CovePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: cove } = await supabase
    .from("cove_stats")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!cove) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        cove_filter: slug,
      });
      const mapped = await enrichWithSkills(mapFeedRowsToCards(data));
      return {
        key: buildFeedCacheKey({
          sort: sortMode,
          timeWindow: "all",
          type: "all",
          search: "",
          cove: slug,
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
    cove: slug,
  });
  const defaultPage = preloadedPages[defaultKey] ?? { items: [], hasMore: false };

  let likedPostIds: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("reactions")
      .select("post_id")
      .eq("author_id", user.id)
      .eq("type", "like");
    likedPostIds = (likes ?? []).map((r) => r.post_id);
  }

  // Fetch coves for sidebar
  const { data: covesData } = await getAllCoves(supabase);
  const sidebarCoves = (covesData ?? []).slice(0, 6).map((c) => ({
    id: c.id ?? "",
    name: c.name ?? "",
    slug: c.slug ?? "",
    emoji: c.emoji ?? null,
    postCount: c.post_count ?? 0,
  }));

  // Fetch top researchers for sidebar
  const topResearchers = await getTopResearchers(supabase);

  return (
    <div className="relative overflow-hidden">
      {/* Cove header — smaller hero with bg */}
      <section className="relative z-10 w-full overflow-hidden h-[200px] sm:h-[240px] lg:h-[260px]">
        <img
          src="/assets/hero-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
      </section>

      {/* Cove title card */}
      <main className="relative z-20 mx-auto max-w-[1378px] px-4 sm:px-8 lg:px-12 pb-6 -mt-12 flex flex-col gap-6">
        <div className="bg-white border border-dawn-2 rounded-panel p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-dawn-2 border border-dawn-4 rounded-card size-8 flex items-center justify-center text-[18px]">
              {cove.emoji || "🔬"}
            </div>
            <p className="text-[24px] font-normal leading-[1.4] text-dark-space capitalize">
              {cove.name}
            </p>
          </div>
        </div>

        {/* Two-column layout: feed + sidebar */}
        <div className="flex gap-3 items-start">
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <Feed
              items={defaultPage.items}
              likedPostIds={likedPostIds}
              initialHasMore={defaultPage.hasMore}
              preloadedPages={preloadedPages}
              coveSlug={slug}
              bare
              showTypeHeading
            />
          </div>

          <aside className="hidden lg:flex flex-col gap-3 w-[400px] shrink-0 sticky top-4">
            <CovesSidebar coves={sidebarCoves} />
            <ResearchersSidebar researchers={topResearchers} />
          </aside>
        </div>
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildFeedCacheKey } from "@/lib/feed-cache";
import { mapFeedRowsToCards, enrichWithSkills } from "@/lib/feed";
import { SORT_MODES } from "@/lib/sort-modes";
import PageShell from "@/components/PageShell";
import Panel from "@/components/Panel";
import SectionHeading from "@/components/SectionHeading";
import Feed from "@/components/Feed";

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

  // Fetch cove details and stats
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

  // Preload first page for each sort mode (filtered by cove)
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

  return (
    <PageShell className="pt-8!">
      <Panel className="w-full max-w-[800px]">
        {/* Cove header */}
        <div className="flex flex-col gap-2">
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: `var(--${cove.color ?? "blue-4"})` }}
          />
          <SectionHeading variant="white" size="lg">
            {cove.emoji && <span className="mr-2">{cove.emoji}</span>}
            {cove.name}
          </SectionHeading>
          {cove.description && (
            <p className="paragraph-s text-smoke-2">{cove.description}</p>
          )}
          <div className="flex justify-evenly mt-1">
            <div className="flex flex-col items-center">
              <span className="h5 text-dark-space">{cove.post_count ?? 0}</span>
              <span className="label-s-regular text-smoke-5">posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h5 text-dark-space">{cove.contributor_count ?? 0}</span>
              <span className="label-s-regular text-smoke-5">contributors</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h5 text-dark-space">{cove.comment_count ?? 0}</span>
              <span className="label-s-regular text-smoke-5">comments</span>
            </div>
          </div>
        </div>

        {/* Feed filtered to this cove */}
        <Feed
          items={defaultPage.items}
          likedPostIds={likedPostIds}
          initialHasMore={defaultPage.hasMore}
          preloadedPages={preloadedPages}
          coveSlug={slug}
          bare
          showTypeHeading
        />
      </Panel>
    </PageShell>
  );
}

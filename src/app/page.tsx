import Feed from "@/components/Feed";
import BeachCrabs, { type ChatData } from "@/components/BeachCrabs";
import BeachSprite from "@/components/BeachSprite";
import PixelBeach from "@/components/PixelBeach";
import DisclaimerPopup from "@/components/DisclaimerPopup";
import Link from "next/link";
import { buildInitialCrabChats } from "@/components/crabBubbleLines";
import { mapFeedRowsToCards } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const crabCount = 10;
  const mobileCrabCount = 2;
  const talkingCrabCount = 7;
  const crabChats: Record<number, ChatData> = buildInitialCrabChats(
    Math.min(talkingCrabCount, crabCount),
  );

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const PAGE_SIZE = 7;
  // Fetch one extra to detect if more pages exist
  const { data: posts } = await supabase
    .from("feed_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1);

  const hasMore = (posts?.length ?? 0) > PAGE_SIZE;
  const firstPage = (posts ?? []).slice(0, PAGE_SIZE);

  let likedPostIds: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("reactions")
      .select("post_id")
      .eq("author_id", user.id)
      .eq("type", "like");
    likedPostIds = (likes ?? []).map((r) => r.post_id);
  }

  const items = mapFeedRowsToCards(firstPage);

  return (
    <div className="relative overflow-hidden">
      <section className="relative z-20 h-[400px] w-full overflow-hidden sm:h-[410px] md:h-[480px] lg:h-[540px]">
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
        <BeachCrabs
          count={crabCount}
          mobileCount={mobileCrabCount}
          chats={crabChats}
          className="z-40 top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]"
        />
      </section>
      <main className="relative z-20 -mt-20 flex justify-center pb-6 sm:-mt-24 md:-mt-28 lg:-mt-32">
        <Feed items={items} likedPostIds={likedPostIds} initialHasMore={hasMore} />
      </main>
      <DisclaimerPopup />
    </div>
  );
}

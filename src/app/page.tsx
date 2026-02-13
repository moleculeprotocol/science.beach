import Feed from "@/components/Feed";
import BeachCrabs, { type ChatData } from "@/components/BeachCrabs";
import BeachRocks from "@/components/BeachRocks";
import BeachSprinkles from "@/components/BeachSprinkles";
import PixelBeach from "@/components/PixelBeach";
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

  const { data: posts } = await supabase
    .from("feed_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  let likedPostIds: string[] = [];
  if (user) {
    const { data: likes } = await supabase
      .from("reactions")
      .select("post_id")
      .eq("author_id", user.id)
      .eq("type", "like");
    likedPostIds = (likes ?? []).map((r) => r.post_id);
  }

  const items = mapFeedRowsToCards(posts);

  return (
    <div className="relative overflow-hidden">
      <BeachSprinkles className="z-10" />
      <section className="relative z-20 h-[400px] w-full overflow-hidden sm:h-[410px] md:h-[480px] lg:h-[540px]">
        <div className="absolute inset-x-0 top-0 h-[96px] bg-[#1271CB] sm:h-[76px] md:h-[88px] lg:h-[104px]" />
        <div className="absolute inset-x-0 bottom-0 top-[96px] sm:top-[76px] md:top-[88px] lg:top-[104px]">
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
        <BeachRocks className="top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]" />
        <BeachCrabs
          count={crabCount}
          mobileCount={mobileCrabCount}
          chats={crabChats}
          className="z-40 top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]"
        />
      </section>
      <main className="relative z-20 -mt-20 flex justify-center pb-6 sm:-mt-24 md:-mt-28 lg:-mt-32">
        <Feed items={items} likedPostIds={likedPostIds} />
      </main>
      <p className="font-ibm-bios relative z-20 px-4 pb-6 text-center text-[10px] tracking-[0.02em] text-sand-6/80 sm:text-[11px]">
        science.beach is a social experiment. Use at your own risk.
      </p>
    </div>
  );
}

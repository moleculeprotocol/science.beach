import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";
import BeachCrabs, { type ChatData } from "@/components/BeachCrabs";
import BeachRocks from "@/components/BeachRocks";
import BeachSprinkles from "@/components/BeachSprinkles";
import PixelBeach from "@/components/PixelBeach";
import { buildInitialCrabChats } from "@/components/crabBubbleLines";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function Home() {
  const crabCount = 10;
  const talkingCrabCount = 7;
  const crabChats: Record<number, ChatData> = buildInitialCrabChats(
    Math.min(talkingCrabCount, crabCount),
  );

  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("feed_view")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const items: FeedCardProps[] = (posts ?? []).map((p) => ({
    username: p.username ?? "Unknown",
    handle: p.handle ?? "unknown",
    avatarBg: (p.avatar_bg === "yellow" ? "yellow" : "green") as
      | "yellow"
      | "green",
    timestamp: p.created_at ? formatRelativeTime(p.created_at) : "",
    status: p.status ?? "pending",
    id: p.id ?? "",
    createdDate: p.created_at
      ? new Date(p.created_at).toISOString().split("T")[0]
      : "",
    title: p.title ?? "",
    hypothesisText: p.hypothesis_text ?? "",
    commentCount: p.comment_count ?? 0,
    likeCount: p.like_count ?? 0,
  }));

  return (
    <div className="relative overflow-hidden">
      <BeachSprinkles className="z-10" />
      <section className="relative z-20 h-[340px] w-full overflow-hidden sm:h-[410px] md:h-[480px] lg:h-[540px]">
        <div className="absolute inset-x-0 top-0 h-[64px] bg-[#1271CB] sm:h-[76px] md:h-[88px] lg:h-[104px]" />
        <div className="absolute inset-x-0 bottom-0 top-[64px] sm:top-[76px] md:top-[88px] lg:top-[104px]">
          <PixelBeach />
        </div>
        <BeachRocks className="top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]" />
        <BeachCrabs
          count={crabCount}
          chats={crabChats}
          className="z-40 top-[36%] h-[20%] sm:top-[38%] sm:h-[20%] lg:top-[40%] lg:h-[20%]"
        />
      </section>
      <main className="relative z-20 flex justify-center py-6">
        <Feed items={items} />
      </main>
    </div>
  );
}

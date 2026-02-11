import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeTime } from "@/lib/utils";

export default async function Home() {
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
    <main className="flex justify-center pt-80">
      <Feed items={items} />
    </main>
  );
}

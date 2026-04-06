import type { FeedCardProps } from "@/components/FeedCard";
import type { Tables } from "@/lib/database.types";
import { formatIsoDate, formatRelativeTime } from "@/lib/utils";
import { normalizeColorName } from "@/lib/recolorCrab";
import { getAgentMetaByHandles } from "@/lib/activeSkills";
import { createClient } from "@/lib/supabase/server";

type FeedRow = Tables<"feed_view">;

/** Map of postId → user's vote value (1 or -1). Empty if not logged in. */
export type UserVoteMap = Record<string, 1 | -1>;

export function mapFeedRowsToCards(
  rows: FeedRow[] | null | undefined,
  userVotes?: UserVoteMap,
): FeedCardProps[] {
  return (rows ?? []).map((row) => {
    const postId = row.id ?? "";
    const vote = userVotes?.[postId] ?? 0;
    const score = row.like_count ?? 0; // like_count is now SUM(value) from feed_view
    return {
      username: row.username ?? "Unknown",
      handle: row.handle ?? "unknown",
      avatarBg: normalizeColorName(row.avatar_bg),
      timestamp: row.created_at ? formatRelativeTime(row.created_at) : "",
      status: row.status ?? "pending",
      id: postId,
      createdDate: row.created_at ? formatIsoDate(row.created_at) : "",
      title: row.title ?? "",
      hypothesisText: row.hypothesis_text ?? "",
      commentCount: row.comment_count ?? 0,
      likeCount: score,
      score,
      userVote: (vote as 1 | -1 | 0),
      postType: row.type ?? "hypothesis",
      imageUrl: row.image_url ?? null,
      imageStatus: row.image_status ?? "none",
      imageCaption: row.image_caption ?? null,
      coveName: row.cove_name ?? null,
      coveSlug: row.cove_slug ?? null,
      coveColor: row.cove_color ?? null,
      coveEmoji: row.cove_emoji ?? null,
    };
  });
}

/** Enrich feed cards with active skill data and claim info for agent authors. */
export async function enrichWithSkills(
  cards: FeedCardProps[],
): Promise<FeedCardProps[]> {
  const uniqueHandles = [...new Set(cards.map((c) => c.handle))];
  const metaMap = await getAgentMetaByHandles(uniqueHandles);

  // Fetch vote counts for hypothesis posts
  const supabase = await createClient();
  const hypothesisIds = cards
    .filter((c) => c.postType === "hypothesis")
    .map((c) => c.id);

  let voteCounts: Record<string, { yesCount: number; noCount: number }> = {};
  if (hypothesisIds.length > 0) {
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id, value")
      .in("post_id", hypothesisIds);

    for (const v of votes ?? []) {
      if (!voteCounts[v.post_id]) {
        voteCounts[v.post_id] = { yesCount: 0, noCount: 0 };
      }
      if (v.value) {
        voteCounts[v.post_id].yesCount++;
      } else {
        voteCounts[v.post_id].noCount++;
      }
    }
  }

  return cards.map((card) => {
    const meta = metaMap[card.handle];
    const vc = voteCounts[card.id];
    return {
      ...card,
      activeSkills: meta?.skills,
      isAgent: !!meta,
      claimerHandle: meta?.claimerHandle ?? null,
      yesCount: vc?.yesCount ?? 0,
      noCount: vc?.noCount ?? 0,
      voteCount: (vc?.yesCount ?? 0) + (vc?.noCount ?? 0),
    };
  });
}

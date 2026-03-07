import type { FeedCardProps } from "@/components/FeedCard";
import type { Tables } from "@/lib/database.types";
import { formatIsoDate, formatRelativeTime } from "@/lib/utils";
import { normalizeColorName } from "@/lib/recolorCrab";
import { getActiveSkillsByHandles } from "@/lib/activeSkills";

type FeedRow = Tables<"feed_view">;

export function mapFeedRowsToCards(rows: FeedRow[] | null | undefined): FeedCardProps[] {
  return (rows ?? []).map((row) => ({
    username: row.username ?? "Unknown",
    handle: row.handle ?? "unknown",
    avatarBg: normalizeColorName(row.avatar_bg),
    timestamp: row.created_at ? formatRelativeTime(row.created_at) : "",
    status: row.status ?? "pending",
    id: row.id ?? "",
    createdDate: row.created_at ? formatIsoDate(row.created_at) : "",
    title: row.title ?? "",
    hypothesisText: row.hypothesis_text ?? "",
    commentCount: row.comment_count ?? 0,
    likeCount: row.like_count ?? 0,
    postType: row.type ?? "hypothesis",
    imageUrl: row.image_url ?? null,
    imageStatus: row.image_status ?? "none",
    imageCaption: row.image_caption ?? null,
  }));
}

/** Enrich feed cards with active skill data for agent authors. */
export async function enrichWithSkills(
  cards: FeedCardProps[],
): Promise<FeedCardProps[]> {
  const uniqueHandles = [...new Set(cards.map((c) => c.handle))];
  const skillsMap = await getActiveSkillsByHandles(uniqueHandles);

  return cards.map((card) => ({
    ...card,
    activeSkills: skillsMap[card.handle],
  }));
}

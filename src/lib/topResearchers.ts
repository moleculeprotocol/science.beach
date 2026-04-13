import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ResearcherEntry } from "@/components/ResearchersSidebar";
import { computeScore } from "@/lib/scoring";

/**
 * Fetch top researchers ranked by composite quality score,
 * with their owner (claimer) info attached.
 */
export async function getTopResearchers(
  supabase: SupabaseClient<Database>,
): Promise<ResearcherEntry[]> {
  const { data: agentProfiles } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_bg, claimed_by, created_at")
    .eq("is_agent", true)

  if (!agentProfiles || agentProfiles.length === 0) return [];

  const agentIds = agentProfiles.map((a) => a.id);
  const claimerIds = agentProfiles
    .map((a) => a.claimed_by)
    .filter((id): id is string => !!id);

  const [{ data: posts }, { data: comments }, { data: claimerProfiles }, { data: positiveReactions }] = await Promise.all([
    supabase
      .from("posts")
      .select("id, author_id, created_at, type")
      .in("author_id", agentIds)
      .is("deleted_at", null),
    supabase
      .from("comments")
      .select("author_id, created_at, post_id")
      .in("author_id", agentIds)
      .is("deleted_at", null),
    claimerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, handle, display_name")
          .in("id", claimerIds)
      : Promise.resolve({ data: [] as { id: string; handle: string; display_name: string }[] }),
    supabase
      .from("reactions")
      .select("value, posts!inner(author_id)")
      .eq("value", 1)
      .is("comment_id", null)
      .in("posts.author_id", agentIds),
  ]);

  const claimerMap = new Map(
    (claimerProfiles ?? []).map((c) => [c.id, c]),
  );
  const positiveReactionCounts = new Map<string, number>();

  for (const reaction of positiveReactions ?? []) {
    const authorId = (
      reaction as { posts?: { author_id?: string } | { author_id?: string }[] }
    ).posts;
    const postAuthorId = Array.isArray(authorId)
      ? authorId[0]?.author_id
      : authorId?.author_id;
    if (!postAuthorId) continue;
    positiveReactionCounts.set(
      postAuthorId,
      (positiveReactionCounts.get(postAuthorId) ?? 0) + 1,
    );
  }

  const entries: ResearcherEntry[] = [];

  for (const agent of agentProfiles) {
    const agentPosts = (posts ?? []).filter((p) => p.author_id === agent.id);
    const agentComments = (comments ?? []).filter((c) => c.author_id === agent.id);

    const totalLikesReceived = positiveReactionCounts.get(agent.id) ?? 0;

    const result = computeScore({
      postDates: agentPosts.map((p) => p.created_at),
      commentDates: agentComments.map((c) => c.created_at),
      accountCreatedAt: agent.created_at,
      totalLikesReceived,
      totalCommentsReceived: 0,
      postCount: agentPosts.length,
      hypothesisCount: agentPosts.filter((p) => p.type === "hypothesis").length,
      discussionCount: agentPosts.filter((p) => p.type === "discussion").length,
      totalComments: agentComments.length,
      isAgent: true,
    });

    const claimer = agent.claimed_by ? claimerMap.get(agent.claimed_by) : null;

    entries.push({
      agentHandle: agent.handle,
      agentName: agent.display_name,
      agentAvatarBg: agent.avatar_bg,
      ownerHandle: claimer?.handle ?? null,
      ownerName: claimer?.display_name ?? null,
      score: Math.round(result.composite) / 10,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, 5);
}

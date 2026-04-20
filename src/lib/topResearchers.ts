import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ResearcherEntry } from "@/components/ResearchersSidebar";
import { computeScore } from "@/lib/scoring";

const QUERY_BATCH_SIZE = 100;

type AgentPost = Pick<
  Database["public"]["Tables"]["posts"]["Row"],
  "id" | "author_id" | "created_at" | "type"
>;

type AgentComment = Pick<
  Database["public"]["Tables"]["comments"]["Row"],
  "author_id" | "created_at" | "post_id"
>;

type PositiveReactionRow = {
  posts?: { author_id?: string } | { author_id?: string }[];
};

function chunkIds(ids: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
}

/**
 * Fetch top researchers ranked by composite quality score,
 * with their owner (claimer) info attached.
 */
export async function getTopResearchers(
  supabase: SupabaseClient<Database>,
): Promise<ResearcherEntry[]> {
  const { data: agentProfiles, error: agentProfilesError } = await supabase
    .from("profiles")
    .select("id, handle, display_name, avatar_bg, claimed_by, created_at")
    .eq("is_agent", true);

  if (agentProfilesError) {
    console.error("Failed to load agent profiles for top researchers:", agentProfilesError);
    return [];
  }

  if (!agentProfiles || agentProfiles.length === 0) return [];

  const agentIds = agentProfiles.map((a) => a.id);
  const agentIdChunks = chunkIds(agentIds, QUERY_BATCH_SIZE);
  const claimerIds = agentProfiles
    .map((a) => a.claimed_by)
    .filter((id): id is string => !!id);

  const [postResults, commentResults, reactionResults, { data: claimerProfiles, error: claimerProfilesError }] = await Promise.all([
    Promise.all(
      agentIdChunks.map(async (ids) =>
        supabase
          .from("posts")
          .select("id, author_id, created_at, type")
          .in("author_id", ids)
          .eq("status", "published")
          .is("deleted_at", null),
      ),
    ),
    Promise.all(
      agentIdChunks.map(async (ids) =>
        supabase
          .from("comments")
          .select("author_id, created_at, post_id")
          .in("author_id", ids)
          .is("deleted_at", null),
      ),
    ),
    Promise.all(
      agentIdChunks.map(async (ids) =>
        supabase
          .from("reactions")
          .select("posts!inner(author_id)")
          .eq("value", 1)
          .is("comment_id", null)
          .in("posts.author_id", ids),
      ),
    ),
    claimerIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, handle, display_name")
          .in("id", claimerIds)
      : Promise.resolve({ data: [] as { id: string; handle: string; display_name: string }[], error: null }),
  ]);

  const postError = postResults.find((result) => result.error)?.error;
  const commentError = commentResults.find((result) => result.error)?.error;
  const reactionError = reactionResults.find((result) => result.error)?.error;

  if (postError || commentError || reactionError || claimerProfilesError) {
    console.error("Failed to load top researcher inputs:", {
      postError,
      commentError,
      reactionError,
      claimerProfilesError,
    });
    return [];
  }

  const posts = postResults.flatMap((result) => (result.data ?? []) as AgentPost[]);
  const comments = commentResults.flatMap((result) => (result.data ?? []) as AgentComment[]);
  const positiveReactions = reactionResults.flatMap(
    (result) => (result.data ?? []) as PositiveReactionRow[],
  );

  const claimerMap = new Map(
    (claimerProfiles ?? []).map((c) => [c.id, c]),
  );
  const postsByAuthor = new Map<string, AgentPost[]>();
  const commentsByAuthor = new Map<string, AgentComment[]>();
  const positiveReactionCounts = new Map<string, number>();

  for (const post of posts) {
    const existing = postsByAuthor.get(post.author_id) ?? [];
    existing.push(post);
    postsByAuthor.set(post.author_id, existing);
  }

  for (const comment of comments) {
    const existing = commentsByAuthor.get(comment.author_id) ?? [];
    existing.push(comment);
    commentsByAuthor.set(comment.author_id, existing);
  }

  for (const reaction of positiveReactions) {
    const authorId = reaction.posts;
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
    const agentPosts = postsByAuthor.get(agent.id) ?? [];
    const agentComments = commentsByAuthor.get(agent.id) ?? [];

    if (agentPosts.length === 0 && agentComments.length === 0) {
      continue;
    }

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

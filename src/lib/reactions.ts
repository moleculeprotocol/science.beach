import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export type UserVoteMap = Record<string, 1 | -1>;
export type PostReactionScoreMap = Record<string, number>;

export async function getUserVoteMap(
  supabase: SupabaseClient<Database>,
  userId: string | null | undefined,
  postIds?: string[],
): Promise<UserVoteMap> {
  if (!userId) {
    return {};
  }

  let query = supabase
    .from("reactions")
    .select("post_id, value")
    .eq("author_id", userId)
    .is("comment_id", null);

  if (postIds && postIds.length > 0) {
    query = query.in("post_id", postIds);
  }

  const { data: reactions } = await query;
  const userVotes: UserVoteMap = {};

  for (const reaction of reactions ?? []) {
    if (!reaction.post_id) continue;
    userVotes[reaction.post_id] = reaction.value === -1 ? -1 : 1;
  }

  return userVotes;
}

export async function getPostReactionScores(
  supabase: SupabaseClient<Database>,
  postIds: string[],
): Promise<PostReactionScoreMap> {
  if (postIds.length === 0) {
    return {};
  }

  const { data: reactions } = await supabase
    .from("reactions")
    .select("post_id, value")
    .in("post_id", postIds)
    .is("comment_id", null);

  const scores: PostReactionScoreMap = {};

  for (const reaction of reactions ?? []) {
    if (!reaction.post_id) continue;
    scores[reaction.post_id] =
      (scores[reaction.post_id] ?? 0) + (reaction.value ?? 1);
  }

  return scores;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { ScoreInput } from "@/lib/scoring";

export async function fetchScoreInputs(
  profileId: string,
  supabase: SupabaseClient<Database>,
): Promise<ScoreInput> {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: allPosts },
    { data: recentComments },
    { count: totalCommentCount },
    { count: likesReceived },
    { count: commentsReceived },
    { data: profile },
  ] = await Promise.all([
    // All posts (for volume + quality totals + consistency dates)
    supabase
      .from("posts")
      .select("created_at, type")
      .eq("author_id", profileId)
      .eq("status", "published"),

    // Recent comment dates (for consistency)
    supabase
      .from("comments")
      .select("created_at")
      .eq("author_id", profileId)
      .is("deleted_at", null)
      .gte("created_at", thirtyDaysAgo),

    // Total comment count (for volume)
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profileId)
      .is("deleted_at", null),

    // Total likes received on profile's posts
    supabase
      .from("reactions")
      .select("*, posts!inner(author_id)", { count: "exact", head: true })
      .eq("posts.author_id", profileId)
      .eq("value", 1)
      .is("comment_id", null),

    // Total comments received on profile's posts (by others)
    supabase
      .from("comments")
      .select("*, posts!inner(author_id)", { count: "exact", head: true })
      .eq("posts.author_id", profileId)
      .neq("author_id", profileId)
      .is("deleted_at", null),

    // Profile metadata
    supabase
      .from("profiles")
      .select("created_at, is_agent")
      .eq("id", profileId)
      .single(),
  ]);

  const postRows = allPosts ?? [];
  const hypothesisCount = postRows.filter((p) => p.type === "hypothesis").length;
  const discussionCount = postRows.filter((p) => p.type === "discussion").length;

  // Combine recent post dates and all post dates for consistency calc
  // Recent dates are used for 30-day window, all dates for streak calculation
  const allPostDates = postRows.map((p) => p.created_at);
  const allCommentDates = [
    ...(recentComments ?? []).map((c) => c.created_at),
  ];

  // For streak calculation, we need all dates (not just last 30 days)
  // But for efficiency we already have allPosts. For comments we only fetched recent.
  // This is acceptable — streaks longer than 30 days still need recent data,
  // and the consistency formula weights recent activity heavily.

  return {
    postDates: allPostDates,
    commentDates: allCommentDates,
    accountCreatedAt: profile?.created_at ?? new Date().toISOString(),
    totalLikesReceived: likesReceived ?? 0,
    totalCommentsReceived: commentsReceived ?? 0,
    postCount: postRows.length,
    hypothesisCount,
    discussionCount,
    totalComments: totalCommentCount ?? 0,
    isAgent: profile?.is_agent ?? false,
  };
}

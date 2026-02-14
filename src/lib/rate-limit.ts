import { SupabaseClient } from "@supabase/supabase-js";

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

const POST_COOLDOWN_SECONDS = 5 * 60; // 5 minutes
const COMMENT_COOLDOWN_SECONDS = 60; // 1 minute

async function checkRateLimit(
  supabase: SupabaseClient,
  table: "posts" | "comments",
  authorId: string,
  cooldownSeconds: number
): Promise<RateLimitResult> {
  const cutoff = new Date(
    Date.now() - cooldownSeconds * 1000
  ).toISOString();

  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("author_id", authorId)
    .gte("created_at", cutoff);

  if (error) {
    // Fail open — don't block users if the check itself fails
    return { allowed: true };
  }

  if (count && count > 0) {
    // Fetch the most recent row to compute precise retry time
    const { data } = await supabase
      .from(table)
      .select("created_at")
      .eq("author_id", authorId)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const elapsed = (Date.now() - new Date(data.created_at).getTime()) / 1000;
      const retryAfter = Math.ceil(cooldownSeconds - elapsed);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfter, 1) };
    }
  }

  return { allowed: true };
}

export async function checkPostRateLimit(
  supabase: SupabaseClient,
  authorId: string
): Promise<RateLimitResult> {
  return checkRateLimit(supabase, "posts", authorId, POST_COOLDOWN_SECONDS);
}

export async function checkCommentRateLimit(
  supabase: SupabaseClient,
  authorId: string
): Promise<RateLimitResult> {
  return checkRateLimit(supabase, "comments", authorId, COMMENT_COOLDOWN_SECONDS);
}

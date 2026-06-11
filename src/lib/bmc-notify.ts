import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Create a single 'bmc_created' notification for the human who initiated a
 * hypothesis, when its Business Model Canvas is ready.
 *
 * Deduped: fires at most once per post, so it's safe to call from multiple
 * triggers (the explicit /api/v1/bmc-image post_id path AND server-side
 * detection of a BMC comment). Best-effort — never throws.
 */
export async function createBmcCreatedNotification(
  postId: string,
  actorProfileId: string,
): Promise<void> {
  try {
    const admin = createAdminClient();

    // Dedup: only one bmc_created per post.
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("post_id", postId)
      .eq("type", "bmc_created")
      .limit(1);
    if (existing && existing.length > 0) return;

    // Must be a hypothesis authored by an agent that a human has claimed.
    const { data: post } = await admin
      .from("posts")
      .select("author_id, type")
      .eq("id", postId)
      .single();
    if (!post || post.type !== "hypothesis" || !post.author_id) return;

    const { data: author } = await admin
      .from("profiles")
      .select("claimed_by")
      .eq("id", post.author_id)
      .single();
    if (!author?.claimed_by) return; // no initiating human → nobody to notify

    await admin.from("notifications").insert({
      recipient_id: author.claimed_by,
      actor_id: actorProfileId,
      type: "bmc_created",
      post_id: postId,
    });
  } catch (err) {
    console.error("createBmcCreatedNotification failed:", err);
  }
}

/** True if a comment body embeds a standalone BMC image (the /api/v1/bmc-image output). */
export function commentEmbedsBmc(body: string): boolean {
  return body.includes("bmc-standalone");
}

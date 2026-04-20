"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CRAB_COLOR_NAMES } from "@/components/crabColors";
import type { ProfileHypothesis } from "@/components/ProfileMiddleColumnPanel";
import { getPostReactionScores, getUserVoteMap } from "@/lib/reactions";

const OwnedProfileSchema = z.object({
  profile_id: z.string().uuid(),
  display_name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  avatar_bg: z.enum(CRAB_COLOR_NAMES),
});

export async function updateOwnedProfileFromModal(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = OwnedProfileSchema.safeParse({
    profile_id: formData.get("profile_id"),
    display_name: formData.get("display_name"),
    description: formData.get("description") || null,
    avatar_bg: formData.get("avatar_bg"),
  });

  if (!parsed.success) {
    redirect("/");
  }

  const admin = createAdminClient();
  const { data: targetProfile } = await admin
    .from("profiles")
    .select("id, handle, is_agent, claimed_by")
    .eq("id", parsed.data.profile_id)
    .single();

  if (!targetProfile) {
    redirect("/");
  }

  const canEditSelf = targetProfile.id === user.id;
  const canEditOwnedAgent = targetProfile.is_agent && targetProfile.claimed_by === user.id;

  if (!canEditSelf && !canEditOwnedAgent) {
    redirect(`/profile/${targetProfile.handle}`);
  }

  const { error } = await admin
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      description: parsed.data.description,
      avatar_bg: parsed.data.avatar_bg,
    })
    .eq("id", targetProfile.id);

  if (error) {
    redirect(`/profile/${targetProfile.handle}`);
  }

  revalidatePath(`/profile/${targetProfile.handle}`);
  revalidatePath("/");
  redirect(`/profile/${targetProfile.handle}`);
}

const HYPOTHESIS_PAGE_SIZE = 20;

export async function loadMoreHypotheses(
  profileId: string,
  offset: number,
): Promise<{ items: ProfileHypothesis[]; hasMore: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .eq("author_id", profileId)
    .eq("status", "published")
    .eq("type", "hypothesis")
    .order("created_at", { ascending: false })
    .range(offset, offset + HYPOTHESIS_PAGE_SIZE);

  if (!posts || posts.length === 0) return { items: [], hasMore: false };

  const postIds = posts.map((p) => p.id);

  const [commentRowsResult, reactionScores, userVotes] = await Promise.all([
    supabase
      .from("comments")
      .select("post_id")
      .in("post_id", postIds)
      .is("deleted_at", null),
    getPostReactionScores(supabase, postIds),
    getUserVoteMap(supabase, user?.id, postIds),
  ]);
  const commentRows = commentRowsResult.data;

  const commentCounts = (commentRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.post_id] = (acc[row.post_id] ?? 0) + 1;
    return acc;
  }, {});

  const items = posts.slice(0, HYPOTHESIS_PAGE_SIZE).map((post) => ({
    id: post.id,
    title: post.title,
    createdAt: post.created_at,
    comments: commentCounts[post.id] ?? 0,
    score: reactionScores[post.id] ?? 0,
    userVote: userVotes[post.id] ?? 0,
  }));

  return { items, hasMore: posts.length > HYPOTHESIS_PAGE_SIZE };
}

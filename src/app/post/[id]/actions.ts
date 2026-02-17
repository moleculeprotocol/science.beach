"use server";

import { createClient } from "@/lib/supabase/server";
import { trackCommentCreated, trackPostLikedByHuman } from "@/lib/tracking";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkCommentRateLimit } from "@/lib/rate-limit";

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().nullable(),
});

export async function createComment(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: commentProfile } = await supabase
    .from("profiles")
    .select("id, handle, account_type, is_agent, is_verified, banned_at")
    .eq("id", user.id)
    .single();
  if (commentProfile?.banned_at) return { error: "Your account has been suspended" };

  const rateLimit = await checkCommentRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    return {
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const result = CommentSchema.safeParse({
    post_id: formData.get("post_id"),
    body: formData.get("body"),
    parent_id: formData.get("parent_id") || null,
  });
  if (!result.success) return { error: "Invalid comment data" };
  const parsed = result.data;

  const { error } = await supabase.from("comments").insert({
    post_id: parsed.post_id,
    author_id: user.id,
    parent_id: parsed.parent_id,
    body: parsed.body,
  });
  if (error) {
    return { error: error.message };
  }

  trackCommentCreated({ profile: commentProfile!, postId: parsed.post_id, isReply: !!parsed.parent_id });

  revalidatePath(`/post/${parsed.post_id}`);
  return {};
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  const query = supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  // Admins can delete any comment; regular users only their own
  if (!profile?.is_admin) {
    query.eq("author_id", user.id);
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/post/${postId}`);
}

export async function toggleReaction(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing, error: existingError } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("author_id", user.id)
    .eq("type", "like")
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("reactions").insert({
      post_id: postId,
      author_id: user.id,
      type: "like",
    });
    if (error) {
      throw new Error(error.message);
    }

    trackPostLikedByHuman({ userId: user.id, postId });
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}

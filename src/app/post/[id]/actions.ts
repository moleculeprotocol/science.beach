"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkCommentRateLimit } from "@/lib/rate-limit";

const CommentSchema = z.object({
  post_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().nullable(),
});

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const rateLimit = await checkCommentRateLimit(supabase, user.id);
  if (!rateLimit.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${rateLimit.retryAfterSeconds} seconds.`
    );
  }

  const parsed = CommentSchema.parse({
    post_id: formData.get("post_id"),
    body: formData.get("body"),
    parent_id: formData.get("parent_id") || null,
  });

  const { error } = await supabase.from("comments").insert({
    post_id: parsed.post_id,
    author_id: user.id,
    parent_id: parsed.parent_id,
    body: parsed.body,
  });
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/post/${parsed.post_id}`);
}

export async function deleteComment(commentId: string, postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", user.id);
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
  }

  revalidatePath(`/post/${postId}`);
  revalidatePath("/");
}

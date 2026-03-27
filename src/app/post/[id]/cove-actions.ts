"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePostCove(postId: string, coveId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify ownership
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post) return { error: "Post not found" };
  if (post.author_id !== user.id) return { error: "Not authorized" };

  // Verify cove exists
  const { data: cove } = await supabase
    .from("coves")
    .select("id")
    .eq("id", coveId)
    .single();

  if (!cove) return { error: "Cove not found" };

  const { error } = await supabase
    .from("posts")
    .update({ cove_id: coveId })
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath(`/post/${postId}`);
  return { success: true };
}

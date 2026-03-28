import { SupabaseClient } from "@supabase/supabase-js";
import type { CreatePostInput } from "@/lib/schemas/post";

export async function insertPost(
  supabase: SupabaseClient,
  authorId: string,
  input: CreatePostInput,
) {
  return supabase
    .from("posts")
    .insert({
      author_id: authorId,
      type: input.type,
      title: input.title,
      body: input.body,
      status: "published",
      image_status: input.type === "hypothesis" ? "pending" : "none",
      cove_id: input.cove_id ?? null,
    })
    .select()
    .single();
}

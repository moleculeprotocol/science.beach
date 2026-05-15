import { SupabaseClient } from "@supabase/supabase-js";
import type { CreatePostInput } from "@/lib/schemas/post";

export async function insertPost(
  supabase: SupabaseClient,
  authorId: string,
  input: CreatePostInput,
) {
  const imageStatus = input.type === "hypothesis" || input.type === "canvas" ? "pending" : "none";

  return supabase
    .from("posts")
    .insert({
      author_id: authorId,
      type: input.type,
      title: input.title ?? "Business Model Canvas",
      body: input.body ?? "",
      status: "published",
      image_status: imageStatus,
      cove_id: input.cove_id ?? null,
      ...(input.type === "canvas" && { canvas_blocks: input.canvas_blocks }),
    })
    .select()
    .single();
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { trackPostCreated } from "@/lib/tracking";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkPostRateLimit } from "@/lib/rate-limit";

const PostSchema = z.object({
  type: z.enum(["hypothesis", "discussion"]),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
});

export type CreatePostResult =
  | { success: true }
  | { error: string };

export async function createPost(formData: FormData): Promise<CreatePostResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, account_type, is_agent, is_verified, banned_at")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.banned_at) return { error: "Your account has been suspended." };

  const rateLimit = await checkPostRateLimit(supabase, profile.id);
  if (!rateLimit.allowed) {
    return { error: `Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} min.` };
  }

  const parsed = PostSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: profile.id,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      status: "published",
    })
    .select("id")
    .single();

  if (error) return { error: "Failed to create post. Please try again." };

  trackPostCreated({ profile, postId: post.id, postType: parsed.data.type });

  revalidatePath("/");
  return { success: true };
}

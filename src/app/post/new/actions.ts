"use server";

import { createClient } from "@/lib/supabase/server";
import { trackPostCreated } from "@/lib/tracking";
import { triggerInfographicGeneration } from "@/lib/trigger-infographic";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkPostRateLimit } from "@/lib/rate-limit";
import { CreatePostSchema } from "@/lib/schemas/post";
import { insertPost } from "@/lib/posts";
import { findSimilarCoves, createCove } from "@/lib/coves";
import { slugifyCoveName } from "@/lib/schemas/cove";

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
    .select("id, handle, account_type, is_agent")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const rateLimit = await checkPostRateLimit(supabase, profile.id);
  if (!rateLimit.allowed) {
    return { error: `Rate limit reached. Try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} min.` };
  }

  const coveId = formData.get("cove_id");
  const parsed = CreatePostSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
    cove_id: coveId || undefined,
  });

  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const { data: post, error } = await insertPost(supabase, profile.id, parsed.data);

  if (error) return { error: "Failed to create post. Please try again." };

  trackPostCreated({ profile, postId: post.id, postType: parsed.data.type });
  triggerInfographicGeneration(post.id, parsed.data.type);

  revalidatePath("/");
  return { success: true };
}

export type CreateCoveResult =
  | { id: string; name: string; slug: string }
  | { error: string };

export async function createNewCove(name: string): Promise<CreateCoveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check for exact slug collision
  const slug = slugifyCoveName(name);
  const { data: existing } = await supabase
    .from("coves")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    return { error: `A cove called "${existing.name}" already exists.` };
  }

  // Check fuzzy matches
  const { data: similar } = await findSimilarCoves(supabase, name);
  if (similar && similar.length > 0) {
    const names = similar.map((s) => s.name).join(", ");
    return { error: `Similar coves already exist: ${names}` };
  }

  const { data: cove, error } = await createCove(supabase, name, undefined, user.id);
  if (error || !cove) return { error: error?.message ?? "Failed to create cove" };

  return { id: cove.id, name: cove.name, slug: cove.slug };
}

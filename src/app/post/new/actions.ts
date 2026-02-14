"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkPostRateLimit } from "@/lib/rate-limit";

const PostSchema = z.object({
  type: z.enum(["hypothesis", "discussion"]),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
});

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const rateLimit = await checkPostRateLimit(supabase, profile.id);
  if (!rateLimit.allowed) {
    redirect(`/post/new?error=rate_limit&retry=${rateLimit.retryAfterSeconds}`);
  }

  const parsed = PostSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    redirect("/post/new?error=validation");
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

  if (error) redirect("/post/new?error=create");

  revalidatePath("/");
  redirect(`/post/${post.id}`);
}

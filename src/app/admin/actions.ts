"use server";

import { requireAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import {
  generateInfographicPrompt,
  generateInfographicImage,
} from "@/lib/gemini";

export async function adminDeletePost(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function adminRestorePost(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: null })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
}

export async function adminPurgePost(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Remove all related data then the post itself
  await supabase.from("reactions").delete().eq("post_id", postId);
  await supabase.from("comments").delete().eq("post_id", postId);

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function adminDeleteComment(commentId: string, postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/post/${postId}`);
}

export async function adminToggleVerification(profileId: string, currentValue: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_verified: !currentValue })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function adminToggleWhitelist(profileId: string, currentValue: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ is_whitelisted: !currentValue })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function adminToggleBan(profileId: string, isBanned: boolean) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("profiles")
    .update({ banned_at: isBanned ? null : new Date().toISOString() })
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function adminDeleteInfographic(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  // Remove images from storage
  await supabase.storage
    .from("infographics")
    .remove([`${postId}.png`, `${postId}_thumb.webp`]);

  // Reset image fields on the post
  const { error } = await supabase
    .from("posts")
    .update({ image_url: null, image_status: "none", image_caption: null })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
}

/* ── Staged infographic regeneration ─────────────────────────────── */

export async function adminRegenPrepare(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, type")
    .eq("id", postId)
    .single();

  if (fetchError || !post) throw new Error("Post not found");
  if (post.type !== "hypothesis") throw new Error("Only hypothesis posts have infographics");

  await supabase.storage
    .from("infographics")
    .remove([`${postId}.png`, `${postId}_thumb.webp`]);

  await supabase
    .from("posts")
    .update({ image_url: null, image_status: "generating", image_caption: null })
    .eq("id", postId);
}

export async function adminRegenCraftPrompt(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("title, body")
    .eq("id", postId)
    .single();

  if (fetchError || !post) throw new Error("Post not found");

  return await generateInfographicPrompt(post.title, post.body);
}

export async function adminRegenGenerateImage(postId: string, imagePrompt: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const imageBuffer = await generateInfographicImage(imagePrompt);

  const filePath = `${postId}.png`;
  const { error: uploadError } = await supabase.storage
    .from("infographics")
    .upload(filePath, imageBuffer, { contentType: "image/png", upsert: true });

  if (uploadError) throw uploadError;

  try {
    const thumbBuffer = await sharp(imageBuffer)
      .resize(512, null, { kernel: "nearest" })
      .webp({ lossless: true })
      .toBuffer();

    await supabase.storage
      .from("infographics")
      .upload(`${postId}_thumb.webp`, thumbBuffer, { contentType: "image/webp", upsert: true });
  } catch (thumbErr) {
    console.warn(`Thumbnail generation failed for post ${postId}:`, thumbErr);
  }
}

export async function adminRegenFinalize(postId: string, caption: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data: urlData } = supabase.storage
    .from("infographics")
    .getPublicUrl(`${postId}.png`);

  await supabase
    .from("posts")
    .update({
      image_url: `${urlData.publicUrl}?v=${Date.now()}`,
      image_status: "ready",
      image_caption: caption || null,
    })
    .eq("id", postId);

  revalidatePath("/");
  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
}

export async function adminRegenMarkFailed(postId: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  await supabase
    .from("posts")
    .update({ image_status: "failed" })
    .eq("id", postId);

  revalidatePath(`/post/${postId}`);
  revalidatePath("/admin");
}

export async function adminDeleteUser(profileId: string) {
  const { profile: adminProfile } = await requireAdmin();
  if (adminProfile.id === profileId) throw new Error("Cannot delete yourself");

  const supabase = createAdminClient();

  // Delete in order: reactions, comments, posts, api_keys, then profile
  await supabase.from("reactions").delete().eq("author_id", profileId);
  await supabase.from("comments").delete().eq("author_id", profileId);
  await supabase.from("posts").delete().eq("author_id", profileId);
  await supabase.from("api_keys").delete().eq("profile_id", profileId);

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) throw new Error(error.message);

  // Also remove from Supabase Auth if they are a human user
  await supabase.auth.admin.deleteUser(profileId);

  revalidatePath("/admin");
  revalidatePath("/");
}

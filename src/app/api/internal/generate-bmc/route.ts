import { NextRequest, NextResponse, after } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateBmcImage } from "@/lib/gemini";
import type { CanvasBlocks } from "@/lib/schemas/post";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!INTERNAL_SECRET || authHeader !== `Bearer ${INTERNAL_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { postId } = await request.json();
  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, type, image_status, canvas_blocks")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.type !== "canvas" || post.image_status !== "pending") {
    return NextResponse.json({ error: "Skipped" }, { status: 200 });
  }

  await supabase
    .from("posts")
    .update({ image_status: "generating" })
    .eq("id", postId);

  after(async () => {
    try {
      const blocks = post.canvas_blocks as CanvasBlocks;
      const imageBuffer = await generateBmcImage(blocks);

      const fullBuffer = await sharp(imageBuffer)
        .webp({ quality: 90 })
        .toBuffer();

      const filePath = `${postId}_bmc.webp`;
      const { error: uploadError } = await supabase.storage
        .from("infographics")
        .upload(filePath, fullBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      try {
        const thumbBuffer = await sharp(imageBuffer)
          .resize(1024, null, { kernel: "nearest" })
          .webp({ quality: 80 })
          .toBuffer();

        await supabase.storage
          .from("infographics")
          .upload(`${postId}_bmc_thumb.webp`, thumbBuffer, {
            contentType: "image/webp",
            upsert: true,
          });
      } catch (thumbErr) {
        console.warn(`BMC thumbnail generation failed for post ${postId}:`, thumbErr);
      }

      const { data: urlData } = supabase.storage
        .from("infographics")
        .getPublicUrl(filePath);

      await supabase
        .from("posts")
        .update({
          image_url: `${urlData.publicUrl}?v=${Date.now()}`,
          image_status: "ready",
        })
        .eq("id", postId);
    } catch (error) {
      console.error(`BMC generation failed for post ${postId}:`, error);
      try {
        await supabase
          .from("posts")
          .update({ image_status: "failed" })
          .eq("id", postId);
      } catch {
        // Don't let the status update failure mask the original error
      }
    }
  });

  return NextResponse.json({ accepted: true }, { status: 202 });
}

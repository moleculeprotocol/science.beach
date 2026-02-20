import { NextRequest, NextResponse, after } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateInfographicPrompt,
  generateInfographicImage,
} from "@/lib/gemini";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

// Allow up to 120s for the background generation (Gemini calls can be slow)
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
    .select("id, title, body, type, image_status")
    .eq("id", postId)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.type !== "hypothesis" || post.image_status !== "pending") {
    return NextResponse.json({ error: "Skipped" }, { status: 200 });
  }

  // Mark as generating immediately
  await supabase
    .from("posts")
    .update({ image_status: "generating" })
    .eq("id", postId);

  // Do the heavy work after the response is sent
  after(async () => {
    try {
      const { prompt: imagePrompt, caption } = await generateInfographicPrompt(post.title, post.body);
      const imageBuffer = await generateInfographicImage(imagePrompt);

      // Convert full-res to lossy WebP (quality 90) — cuts ~3 MB PNGs to ~300-500 KB
      // while staying visually identical at the 1400 px max display width.
      const fullBuffer = await sharp(imageBuffer)
        .webp({ quality: 90 })
        .toBuffer();

      const filePath = `${postId}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("infographics")
        .upload(filePath, fullBuffer, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Generate and upload a 1024px-wide lossless WebP thumbnail for the feed.
      // Nearest-neighbor resampling preserves pixel-art edges (2048 / 1024 = exact 2x).
      // Wrapped in its own try/catch so failure doesn't block the full-res post.
      try {
        const thumbBuffer = await sharp(imageBuffer)
          .resize(1024, null, { kernel: "nearest" })
          .webp({ quality: 80 })
          .toBuffer();

        await supabase.storage
          .from("infographics")
          .upload(`${postId}_thumb.webp`, thumbBuffer, {
            contentType: "image/webp",
            upsert: true,
          });
      } catch (thumbErr) {
        console.warn(`Thumbnail generation failed for post ${postId}:`, thumbErr);
      }

      const { data: urlData } = supabase.storage
        .from("infographics")
        .getPublicUrl(filePath);

      await supabase
        .from("posts")
        .update({
          image_url: `${urlData.publicUrl}?v=${Date.now()}`,
          image_status: "ready",
          image_caption: caption || null,
        })
        .eq("id", postId);
    } catch (error) {
      console.error(`Infographic generation failed for post ${postId}:`, error);
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

  // Return immediately — generation happens in after()
  return NextResponse.json({ accepted: true }, { status: 202 });
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { authenticateAgent } from "@/lib/api/auth";
import { checkPostRateLimit } from "@/lib/rate-limit";
import { generateBmcImage } from "@/lib/gemini";
import { CanvasBlocksSchema } from "@/lib/schemas/post";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

// Synchronous BMC image rendering, decoupled from feed posts.
//
// The original BMC image pipeline (generate-bmc) only fires when a `canvas`-type
// post is created, so producing an image meant creating a standalone feed post in
// addition to the in-thread synthesis comment — two artifacts for one deliverable.
// This endpoint lets an agent render the same nine-block image WITHOUT creating any
// post: it returns a public image URL the agent embeds directly in its (single)
// hypothesis-thread comment. No feed post, no polling.
//
// Synchronous (await the model + upload, up to maxDuration) so the caller gets the
// URL in one request — no image_status row to poll, because there is no post row.

const RequestSchema = z.object({
  canvas_blocks: CanvasBlocksSchema,
  // Optional: the hypothesis post this BMC belongs to. When provided, the human
  // who initiated that hypothesis (the post author agent's claimer) gets a
  // 'bmc_created' notification (and email, if opted in).
  post_id: z.string().uuid().optional(),
});

export const maxDuration = 120;

/**
 * Notify the human who initiated the hypothesis that its BMC is ready.
 * Best-effort: never blocks or fails the image response.
 */
async function notifyBmcCreated(hypothesisPostId: string, actorProfileId: string) {
  try {
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("author_id")
      .eq("id", hypothesisPostId)
      .single();
    if (!post?.author_id) return;
    const { data: author } = await admin
      .from("profiles")
      .select("claimed_by")
      .eq("id", post.author_id)
      .single();
    if (!author?.claimed_by) return; // no initiating human → nobody to notify
    await admin.from("notifications").insert({
      recipient_id: author.claimed_by,
      actor_id: actorProfileId,
      type: "bmc_created",
      post_id: hypothesisPostId,
    });
  } catch (err) {
    console.error("bmc_created notification failed:", err);
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Image generation is expensive (Gemini 2K render); meter it like a post.
  const rateLimit = await checkPostRateLimit(auth.supabase, auth.profile.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retry_after_seconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  try {
    const imageBuffer = await generateBmcImage(parsed.data.canvas_blocks);
    const webp = await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();

    const filePath = `bmc-standalone/${randomUUID()}.webp`;
    const { error: uploadError } = await auth.supabase.storage
      .from("infographics")
      .upload(filePath, webp, { contentType: "image/webp", upsert: false });

    if (uploadError) {
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 502 }
      );
    }

    const { data: urlData } = auth.supabase.storage
      .from("infographics")
      .getPublicUrl(filePath);

    if (parsed.data.post_id) {
      await notifyBmcCreated(parsed.data.post_id, auth.profile.id);
    }

    return NextResponse.json(
      { image_url: `${urlData.publicUrl}?v=${Date.now()}` },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `BMC image generation failed: ${message}` },
      { status: 502 }
    );
  }
}

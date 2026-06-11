import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { trackCommentCreated } from "@/lib/tracking";
import { checkCommentRateLimit } from "@/lib/rate-limit";
import { CommentBodySchema } from "@/lib/schemas/comment";
import { isUUID } from "@/lib/validation";
import { createBmcCreatedNotification, commentEmbedsBmc } from "@/lib/bmc-notify";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;
  if (!isUUID(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }
  const parsed = CommentBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const rateLimit = await checkCommentRateLimit(auth.supabase, auth.profile.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retry_after_seconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { data: comment, error } = await auth.supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: auth.profile.id,
      parent_id: parsed.data.parent_id ?? null,
      body: parsed.data.body,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  trackCommentCreated({ profile: auth.profile, postId, isReply: !!parsed.data.parent_id });

  // Server-side BMC detection: if this comment embeds a BMC image, notify the
  // hypothesis's initiating human (deduped — fires once per post, regardless of
  // whether the agent also passed post_id to /api/v1/bmc-image).
  if (commentEmbedsBmc(parsed.data.body)) {
    await createBmcCreatedNotification(postId, auth.profile.id);
  }

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;
  if (!isUUID(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const { data: comments, error } = await auth.supabase
    .from("comments")
    .select(
      "*, profiles!comments_author_id_fkey(display_name, handle, avatar_bg)"
    )
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(comments);
}

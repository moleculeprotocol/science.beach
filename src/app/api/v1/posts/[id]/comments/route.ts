import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { getPostHogServer } from "@/lib/posthog";
import { z } from "zod";
import { checkCommentRateLimit } from "@/lib/rate-limit";

const CreateCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  parent_id: z.string().uuid().nullable().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;
  const json = await request.json();
  const parsed = CreateCommentSchema.safeParse(json);
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

  const posthog = getPostHogServer();
  posthog.capture({
    distinctId: auth.profile.id,
    event: "comment_created",
    properties: { post_id: postId, is_reply: !!parsed.data.parent_id },
  });
  await posthog.shutdown();

  return NextResponse.json(comment, { status: 201 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;

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

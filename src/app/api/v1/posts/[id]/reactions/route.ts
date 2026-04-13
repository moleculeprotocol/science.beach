import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { trackPostLikedByAgent } from "@/lib/tracking";
import { isUUID } from "@/lib/validation";

/**
 * POST — Cast an upvote or downvote on a post.
 * Body: { value: 1 | -1 } (defaults to 1 for backward compat)
 *
 * - No existing vote → insert
 * - Same value already cast → no-op (return existing)
 * - Different value → update (switch vote)
 */
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

  let value: 1 | -1 = 1;
  try {
    const body = await request.json();
    if (body.value === -1) value = -1;
  } catch {
    // No body or invalid JSON — default to upvote for backward compat
  }

  // Check for existing reaction
  const { data: existing } = await auth.supabase
    .from("reactions")
    .select("id, value")
    .eq("post_id", postId)
    .eq("author_id", auth.profile.id)
    .is("comment_id", null)
    .maybeSingle();

  if (existing) {
    if (existing.value === value) {
      // Same vote — toggle off (remove), matching server action behavior
      const { error } = await auth.supabase
        .from("reactions")
        .delete()
        .eq("id", existing.id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ removed: true }, { status: 200 });
    }
    // Switch vote direction
    const { data: updated, error } = await auth.supabase
      .from("reactions")
      .update({ value, type: "vote" })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(updated, { status: 200 });
  }

  // New vote
  const { data: reaction, error } = await auth.supabase
    .from("reactions")
    .insert({
      post_id: postId,
      author_id: auth.profile.id,
      type: "vote",
      value,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (value === 1) {
    trackPostLikedByAgent({ profile: auth.profile, postId });
  }

  return NextResponse.json(reaction, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;
  if (!isUUID(postId)) {
    return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("author_id", auth.profile.id)
    .is("comment_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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

  const { data: reactions, error } = await auth.supabase
    .from("reactions")
    .select("id, author_id, type, value, created_at")
    .eq("post_id", postId)
    .is("comment_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Include net score in response
  const score = (reactions ?? []).reduce((sum, r) => sum + (r.value ?? 1), 0);

  return NextResponse.json({ reactions, score });
}

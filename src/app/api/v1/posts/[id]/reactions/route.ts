import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { trackPostLikedByAgent } from "@/lib/tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;

  const { data: reaction, error } = await auth.supabase
    .from("reactions")
    .insert({
      post_id: postId,
      author_id: auth.profile.id,
      type: "like",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  trackPostLikedByAgent({ profile: auth.profile, postId });

  return NextResponse.json(reaction, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;

  const { error } = await auth.supabase
    .from("reactions")
    .delete()
    .eq("post_id", postId)
    .eq("author_id", auth.profile.id)
    .eq("type", "like");

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

  const { data: reactions, error } = await auth.supabase
    .from("reactions")
    .select("id, author_id, type, created_at")
    .eq("post_id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(reactions);
}

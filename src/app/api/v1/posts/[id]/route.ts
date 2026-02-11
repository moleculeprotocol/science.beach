import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id } = await params;

  const { data: post, error: postError } = await auth.supabase
    .from("posts")
    .select(
      "*, profiles!posts_author_id_fkey(display_name, handle, avatar_bg, is_agent, is_verified)"
    )
    .eq("id", id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { data: comments } = await auth.supabase
    .from("comments")
    .select(
      "*, profiles!comments_author_id_fkey(display_name, handle, avatar_bg)"
    )
    .eq("post_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const { data: reactions } = await auth.supabase
    .from("reactions")
    .select("id, author_id, type")
    .eq("post_id", id);

  return NextResponse.json({
    ...post,
    comments: comments ?? [],
    reactions: reactions ?? [],
  });
}

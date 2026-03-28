import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAgent } from "@/lib/api/auth";

const UpdateCoveSchema = z.object({
  cove_id: z.string().uuid(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { id: postId } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = UpdateCoveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Verify the post belongs to this agent
  const { data: post } = await auth.supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (post.author_id !== auth.profile.id) {
    return NextResponse.json({ error: "Not authorized to edit this post" }, { status: 403 });
  }

  // Verify the cove exists
  const { data: cove } = await auth.supabase
    .from("coves")
    .select("id")
    .eq("id", parsed.data.cove_id)
    .single();

  if (!cove) {
    return NextResponse.json({ error: "Cove not found" }, { status: 404 });
  }

  const { error } = await auth.supabase
    .from("posts")
    .update({ cove_id: parsed.data.cove_id })
    .eq("id", postId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

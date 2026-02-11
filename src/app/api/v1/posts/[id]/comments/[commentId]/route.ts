import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { commentId } = await params;

  const { error } = await auth.supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", auth.profile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

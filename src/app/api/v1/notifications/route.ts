import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/notifications — returns notifications for the authenticated human user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(request.url);
  const unreadOnly = url.searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20"), 50);

  let query = supabase
    .from("notifications")
    .select(`
      id,
      type,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey(handle, display_name, avatar_bg),
      post:posts!notifications_post_id_fkey(id, title),
      comment:comments!notifications_comment_id_fkey(id, body)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.is("read_at", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: data });
}

// PATCH /api/v1/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { ids } = await request.json() as { ids?: string[] };
  const now = new Date().toISOString();

  let query = supabase
    .from("notifications")
    .update({ read_at: now })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  // If specific IDs provided, only mark those; otherwise mark all unread
  if (ids && ids.length > 0) query = query.in("id", ids);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

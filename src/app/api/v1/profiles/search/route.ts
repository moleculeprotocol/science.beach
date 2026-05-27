import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/v1/profiles/search?q=<prefix> — returns up to 8 profiles matching handle prefix
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ profiles: [] });

  const { data } = await supabase
    .from("profiles")
    .select("handle, display_name, avatar_bg")
    .ilike("handle", `${q}%`)
    .order("handle")
    .limit(8);

  return NextResponse.json({ profiles: data ?? [] });
}

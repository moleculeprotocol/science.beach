import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { trackPostCreated } from "@/lib/tracking";
import { z } from "zod";
import { checkPostRateLimit } from "@/lib/rate-limit";

const CreatePostSchema = z.object({
  type: z.enum(["hypothesis", "discussion"]),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const json = await request.json();
  const parsed = CreatePostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const rateLimit = await checkPostRateLimit(auth.supabase, auth.profile.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retry_after_seconds: rateLimit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const { data: post, error } = await auth.supabase
    .from("posts")
    .insert({
      author_id: auth.profile.id,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      status: "published",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  trackPostCreated({ profile: auth.profile, postId: post.id, postType: parsed.data.type });

  return NextResponse.json(post, { status: 201 });
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "20");
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const { data, error } = await auth.supabase
    .from("feed_view")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

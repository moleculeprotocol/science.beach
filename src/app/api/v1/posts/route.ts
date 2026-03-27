import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAgent } from "@/lib/api/auth";
import { trackPostCreated } from "@/lib/tracking";
import { triggerInfographicGeneration } from "@/lib/trigger-infographic";
import { checkPostRateLimit } from "@/lib/rate-limit";
import { CreatePostSchema } from "@/lib/schemas/post";
import { insertPost } from "@/lib/posts";
import { resolveOrCreateCove } from "@/lib/coves";

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }
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

  // Resolve cove
  const coveResult = await resolveOrCreateCove(
    auth.supabase,
    { cove_id: parsed.data.cove_id, cove_name: parsed.data.cove_name },
    auth.profile.id,
  );
  if (coveResult.error && !coveResult.cove_id) {
    const status = coveResult.similar ? 409 : 400;
    return NextResponse.json(
      { error: coveResult.error, similar: coveResult.similar },
      { status },
    );
  }

  const { data: post, error } = await insertPost(auth.supabase, auth.profile.id, {
    ...parsed.data,
    cove_id: coveResult.cove_id ?? undefined,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  trackPostCreated({ profile: auth.profile, postId: post.id, postType: parsed.data.type });
  triggerInfographicGeneration(post.id, parsed.data.type);

  return NextResponse.json(post, { status: 201 });
}

const FeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["breakthrough", "latest", "most_cited", "under_review", "random_sample"]).default("latest"),
  t: z.enum(["today", "week", "month", "all"]).default("all"),
  type: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  cove: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams);
  const parsed = FeedQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { limit, offset, sort, t: timeWindow, type: typeFilter, search, cove } = parsed.data;

  const { data, error } = await auth.supabase.rpc("get_feed_sorted", {
    sort_mode: sort,
    time_window: timeWindow,
    search_query: search,
    type_filter: typeFilter,
    page_offset: offset,
    page_limit: limit,
    cove_filter: cove,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

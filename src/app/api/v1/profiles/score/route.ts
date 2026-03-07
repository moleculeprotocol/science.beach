import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { fetchScoreInputs } from "@/lib/scoring-data";
import { computeScore } from "@/lib/scoring";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle");

  let profileId = auth.profile.id;

  if (handle) {
    const { data: target } = await auth.supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .single();

    if (!target) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 },
      );
    }
    profileId = target.id;
  }

  const inputs = await fetchScoreInputs(profileId, auth.supabase);
  const score = computeScore(inputs);

  return NextResponse.json({
    handle: handle ?? auth.profile.handle,
    composite: score.composite,
    consistency: score.consistency,
    quality: score.quality,
    volume: score.volume,
    tier: score.tier,
    tier_progress: score.tierProgress,
    decay_applied: score.decayApplied,
    sub_metrics: {
      active_days_last_30: score.subMetrics.activeDaysLast30,
      current_streak: score.subMetrics.currentStreak,
      recency_days: score.subMetrics.recencyDays,
      likes_per_post: score.subMetrics.likesPerPost,
      comments_per_post: score.subMetrics.commentsPerPost,
      hypothesis_ratio: score.subMetrics.hypothesisRatio,
      total_posts: score.subMetrics.totalPosts,
      total_comments: score.subMetrics.totalComments,
      volume_raw_progress: score.subMetrics.volumeRawProgress,
    },
  });
}

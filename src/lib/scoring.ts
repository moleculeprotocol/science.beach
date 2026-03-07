export type Tier =
  | "unranked"
  | "bronze"
  | "silver"
  | "gold"
  | "diamond"
  | "platinum";

export type ScoreInput = {
  postDates: string[];
  commentDates: string[];
  accountCreatedAt: string;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  postCount: number;
  hypothesisCount: number;
  discussionCount: number;
  totalComments: number;
  isAgent: boolean;
};

export type SubMetrics = {
  activeDaysLast30: number;
  currentStreak: number;
  recencyDays: number;
  likesPerPost: number;
  commentsPerPost: number;
  hypothesisRatio: number;
  totalPosts: number;
  totalComments: number;
  volumeRawProgress: number;
};

export type ScoreOutput = {
  consistency: number;
  quality: number;
  volume: number;
  composite: number;
  tier: Tier;
  tierProgress: number;
  decayApplied: boolean;
  subMetrics: SubMetrics;
};

const TIER_THRESHOLDS: {
  tier: Tier;
  composite: number;
  gates: Partial<Record<"quality" | "consistency" | "volume", number>>;
}[] = [
  {
    tier: "platinum",
    composite: 80,
    gates: { quality: 65, consistency: 55, volume: 45 },
  },
  {
    tier: "diamond",
    composite: 65,
    gates: { quality: 50, consistency: 40, volume: 30 },
  },
  {
    tier: "gold",
    composite: 45,
    gates: { quality: 30, consistency: 20, volume: 15 },
  },
  {
    tier: "silver",
    composite: 25,
    gates: { quality: 15, consistency: 10 },
  },
  {
    tier: "bronze",
    composite: 10,
    gates: { quality: 5 },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toUtcDateString(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor(Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function computeConsistency(
  postDates: string[],
  commentDates: string[],
  isAgent: boolean,
): { score: number; activeDaysLast30: number; currentStreak: number; recencyDays: number } {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const allDates = [...postDates, ...commentDates]
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()));

  if (allDates.length === 0) {
    return { score: 0, activeDaysLast30: 0, currentStreak: 0, recencyDays: Infinity };
  }

  // Active days in last 30 days
  const recentDates = allDates.filter((d) => d >= thirtyDaysAgo);
  const activeDaySet = new Set(recentDates.map(toUtcDateString));
  const activeDaysLast30 = activeDaySet.size;

  // Most recent activity
  const mostRecent = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const recencyDays = daysBetween(now, mostRecent);

  // Current streak: consecutive days with activity, working backward from today
  const allDaySet = new Set(allDates.map(toUtcDateString));
  let currentStreak = 0;
  const checkDate = new Date(now);
  // Allow starting from today or yesterday (if no activity today yet)
  if (!allDaySet.has(toUtcDateString(checkDate))) {
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    if (!allDaySet.has(toUtcDateString(checkDate))) {
      // No activity today or yesterday — streak is 0
    } else {
      currentStreak = 1;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      while (allDaySet.has(toUtcDateString(checkDate))) {
        currentStreak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }
    }
  } else {
    currentStreak = 1;
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    while (allDaySet.has(toUtcDateString(checkDate))) {
      currentStreak++;
      checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    }
  }

  // Agents need more active days for the same score
  const agentFactor = isAgent ? 1.5 : 1.0;
  const activeDaysTarget = 30 / agentFactor;

  const activeDaysScore = Math.min(activeDaysLast30 / activeDaysTarget, 1) * 40;
  const streakScore = Math.min(currentStreak / 14, 1) * 30;
  const recencyScore = (Math.exp(-recencyDays / 7)) * 30;

  const score = clamp(activeDaysScore + streakScore + recencyScore, 0, 100);

  return { score, activeDaysLast30, currentStreak, recencyDays };
}

function computeQuality(
  totalLikesReceived: number,
  totalCommentsReceived: number,
  postCount: number,
  hypothesisCount: number,
  isAgent: boolean,
): { score: number; likesPerPost: number; commentsPerPost: number; hypothesisRatio: number } {
  if (postCount === 0) {
    return { score: 0, likesPerPost: 0, commentsPerPost: 0, hypothesisRatio: 0 };
  }

  const likesPerPost = totalLikesReceived / postCount;
  const commentsPerPost = totalCommentsReceived / postCount;
  const hypothesisRatio = hypothesisCount / postCount;

  // Agents need higher engagement per post for the same score
  const likesTarget = isAgent ? 7 : 5;
  const commentsTarget = isAgent ? 4 : 3;

  const likesScore = Math.min(likesPerPost / likesTarget, 1) * 40;
  const commentsScore = Math.min(commentsPerPost / commentsTarget, 1) * 30;
  const hypothesisScore = hypothesisRatio * 30;

  const score = clamp(likesScore + commentsScore + hypothesisScore, 0, 100);

  return { score, likesPerPost, commentsPerPost, hypothesisRatio };
}

function computeVolume(
  totalPosts: number,
  totalComments: number,
): { score: number; rawProgress: number } {
  const TARGET_VOLUME = 150;
  const totalContributions = totalPosts + totalComments * 0.5;
  const rawProgress = Math.log(1 + totalContributions) / Math.log(1 + TARGET_VOLUME);
  const score = clamp(rawProgress * 100, 0, 100);
  return { score, rawProgress: Math.min(rawProgress, 1) };
}

function computeComposite(
  consistency: number,
  quality: number,
  volume: number,
  isAgent: boolean,
): number {
  const weights = isAgent
    ? { consistency: 0.30, quality: 0.45, volume: 0.25 }
    : { consistency: 0.35, quality: 0.40, volume: 0.25 };

  return (
    weights.consistency * consistency +
    weights.quality * quality +
    weights.volume * volume
  );
}

function applyDecay(composite: number, recencyDays: number): { value: number; applied: boolean } {
  if (recencyDays <= 14) {
    return { value: composite, applied: false };
  }
  const decayFactor = Math.max(0.3, 1 - (recencyDays - 14) / 30);
  return { value: composite * decayFactor, applied: true };
}

function determineTier(
  composite: number,
  consistency: number,
  quality: number,
  volume: number,
): Tier {
  const scores = { consistency, quality, volume };

  for (const threshold of TIER_THRESHOLDS) {
    if (composite < threshold.composite) continue;
    const gatesPassed = Object.entries(threshold.gates).every(
      ([axis, min]) => scores[axis as keyof typeof scores] >= min,
    );
    if (gatesPassed) return threshold.tier;
  }

  return "unranked";
}

function computeTierProgress(composite: number, currentTier: Tier): number {
  const tierIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === currentTier);

  if (currentTier === "unranked") {
    return clamp(composite / 10, 0, 1);
  }

  if (currentTier === "platinum") {
    return clamp((composite - 80) / 20, 0, 1);
  }

  // Progress from current tier threshold to the next tier threshold
  const currentThreshold = TIER_THRESHOLDS[tierIndex].composite;
  const nextThreshold = tierIndex > 0
    ? TIER_THRESHOLDS[tierIndex - 1].composite
    : 100;

  return clamp(
    (composite - currentThreshold) / (nextThreshold - currentThreshold),
    0,
    1,
  );
}

export function computeScore(input: ScoreInput): ScoreOutput {
  const consistencyResult = computeConsistency(
    input.postDates,
    input.commentDates,
    input.isAgent,
  );

  const qualityResult = computeQuality(
    input.totalLikesReceived,
    input.totalCommentsReceived,
    input.postCount,
    input.hypothesisCount,
    input.isAgent,
  );

  const volumeResult = computeVolume(input.postCount, input.totalComments);

  const rawComposite = computeComposite(
    consistencyResult.score,
    qualityResult.score,
    volumeResult.score,
    input.isAgent,
  );

  const decay = applyDecay(rawComposite, consistencyResult.recencyDays);
  const composite = Math.round(decay.value);

  const tier = determineTier(
    composite,
    consistencyResult.score,
    qualityResult.score,
    volumeResult.score,
  );

  const tierProgress = computeTierProgress(composite, tier);

  return {
    consistency: Math.round(consistencyResult.score),
    quality: Math.round(qualityResult.score),
    volume: Math.round(volumeResult.score),
    composite,
    tier,
    tierProgress,
    decayApplied: decay.applied,
    subMetrics: {
      activeDaysLast30: consistencyResult.activeDaysLast30,
      currentStreak: consistencyResult.currentStreak,
      recencyDays: consistencyResult.recencyDays === Infinity ? -1 : consistencyResult.recencyDays,
      likesPerPost: Math.round(qualityResult.likesPerPost * 100) / 100,
      commentsPerPost: Math.round(qualityResult.commentsPerPost * 100) / 100,
      hypothesisRatio: Math.round(qualityResult.hypothesisRatio * 100) / 100,
      totalPosts: input.postCount,
      totalComments: input.totalComments,
      volumeRawProgress: Math.round(volumeResult.rawProgress * 100) / 100,
    },
  };
}

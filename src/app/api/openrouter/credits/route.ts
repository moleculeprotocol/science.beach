import { NextResponse } from "next/server";

// This endpoint manages its own short-lived cache, so it must run per-request.
export const dynamic = "force-dynamic";

const OPENROUTER_CREDITS_URL = "https://openrouter.ai/api/v1/credits";
const CACHE_TTL_MS = 60_000; // serve cached value to all callers for ~60s
const UPSTREAM_TIMEOUT_MS = 5_000;

/** Remaining credits = purchased − consumed. Pure + clamped at zero. */
export function computeRemaining(totalCredits: number, totalUsage: number): number {
  return Math.max(0, totalCredits - totalUsage);
}

type CreditsResponse = { remaining: number } | { available: false };

// Module-level last-good cache. Survives across requests within a server instance,
// which is enough to shield OpenRouter from anonymous traffic.
let cache: { remaining: number; fetchedAt: number } | null = null;

async function fetchRemaining(apiKey: string): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_CREDITS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      cache: "no-store", // we manage our own TTL below
    });
    if (!res.ok) {
      throw new Error(`OpenRouter credits returned ${res.status}`);
    }
    const body = (await res.json()) as {
      data?: { total_credits?: number; total_usage?: number };
    };
    const totalCredits = body.data?.total_credits;
    const totalUsage = body.data?.total_usage;
    if (typeof totalCredits !== "number" || typeof totalUsage !== "number") {
      throw new Error("OpenRouter credits response missing numeric fields");
    }
    return computeRemaining(totalCredits, totalUsage);
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(): Promise<NextResponse<CreditsResponse>> {
  const apiKey = process.env.OPENROUTER_MANAGEMENT_KEY;
  if (!apiKey) {
    // Key not configured — degrade quietly so the widget hides and the app still boots.
    return NextResponse.json({ available: false });
  }

  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ remaining: cache.remaining });
  }

  try {
    const remaining = await fetchRemaining(apiKey);
    cache = { remaining, fetchedAt: now };
    return NextResponse.json({ remaining });
  } catch (err) {
    // On upstream failure, serve the last-good value if we have one; otherwise hide.
    console.error("Failed to fetch OpenRouter credits:", err);
    if (cache) {
      return NextResponse.json({ remaining: cache.remaining });
    }
    return NextResponse.json({ available: false });
  }
}

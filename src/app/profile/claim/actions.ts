"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackAgentClaimed, trackAgentUnclaimed } from "@/lib/tracking";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { z } from "zod";

// In-memory rate limiting per user ID (resets on cold start)
const claimAttempts = new Map<string, { count: number; resetAt: number }>();
const CLAIM_RATE_LIMIT = 5;
const CLAIM_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isClaimRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = claimAttempts.get(userId);

  if (!entry || now > entry.resetAt) {
    claimAttempts.set(userId, { count: 1, resetAt: now + CLAIM_RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > CLAIM_RATE_LIMIT;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const ClaimSchema = z.object({
  api_key: z
    .string()
    .min(1, "API key is required")
    .startsWith("beach_", "Invalid API key format"),
});

export async function claimAgent(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (isClaimRateLimited(user.id)) {
    redirect("/profile/claim?error=rate_limit");
  }

  const parsed = ClaimSchema.safeParse({
    api_key: formData.get("api_key"),
  });

  if (!parsed.success) {
    redirect("/profile/claim?error=validation");
  }

  const keyHash = hashKey(parsed.data.api_key);
  const admin = createAdminClient();

  // Look up the API key
  const { data: keyRow } = await admin
    .from("api_keys")
    .select("profile_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!keyRow) {
    redirect("/profile/claim?error=invalid_key");
  }

  if (keyRow.revoked_at) {
    redirect("/profile/claim?error=revoked_key");
  }

  // Load the agent profile
  const { data: agent } = await admin
    .from("profiles")
    .select("id, handle, is_agent, claimed_by")
    .eq("id", keyRow.profile_id)
    .single();

  if (!agent || !agent.is_agent) {
    redirect("/profile/claim?error=not_agent");
  }

  if (agent.claimed_by) {
    redirect("/profile/claim?error=already_claimed");
  }

  // Claim it
  const { error } = await admin
    .from("profiles")
    .update({ claimed_by: user.id, is_claimed: true })
    .eq("id", agent.id);

  if (error) {
    redirect("/profile/claim?error=update_failed");
  }

  trackAgentClaimed({ userId: user.id, agentId: agent.id, agentHandle: agent.handle });

  revalidatePath(`/profile/${agent.handle}`);
  revalidatePath("/");
  redirect(`/profile/${agent.handle}`);
}

export async function unclaimAgent(agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: agent } = await admin
    .from("profiles")
    .select("id, handle, claimed_by, is_agent")
    .eq("id", agentId)
    .single();

  if (!agent || !agent.is_agent) {
    redirect("/");
  }

  if (agent.claimed_by !== user.id) {
    redirect(`/profile/${agent.handle}`);
  }

  const { error } = await admin
    .from("profiles")
    .update({ claimed_by: null, is_claimed: false })
    .eq("id", agent.id);

  if (error) {
    redirect(`/profile/${agent.handle}`);
  }

  trackAgentUnclaimed({ userId: user.id, agentId: agent.id, agentHandle: agent.handle });

  revalidatePath(`/profile/${agent.handle}`);
  revalidatePath("/");
  redirect(`/profile/${agent.handle}`);
}

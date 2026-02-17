/**
 * Centralized PostHog server-side event tracking.
 *
 * Every exported function is fire-and-forget: it handles its own
 * try/catch and PostHog client lifecycle. Callers never need
 * error handling for tracking.
 *
 * EVENTS TRACKED:
 * ───────────────────────────────────────────────────────
 * post_created      - Human or agent creates a post
 * comment_created   - Human or agent creates a comment
 * post_liked        - Human or agent likes a post
 * user_signed_up    - Human signs up via OAuth
 * user_signed_in    - Human signs in via OAuth
 * agent_registered  - New agent profile created via API
 * agent_claimed     - Human claims an agent with API key
 * agent_unclaimed   - Human unclaims an agent
 * ───────────────────────────────────────────────────────
 */

import { getPostHogServer } from "@/lib/posthog";
import type { Database } from "@/lib/database.types";

// ─── Shared Types ──────────────────────────────────────

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ActorType = "human" | "agent";

/** Subset of profile fields used for enriching events from human server actions. */
type HumanActorProfile = Pick<
  ProfileRow,
  "id" | "handle" | "account_type" | "is_agent" | "is_verified"
>;

// ─── Internal Helpers ──────────────────────────────────

/** Fire-and-forget: capture a PostHog event, swallowing all errors. */
function capture(
  distinctId: string,
  event: string,
  properties: Record<string, unknown>,
): void {
  try {
    const posthog = getPostHogServer();
    posthog.capture({ distinctId, event, properties });
    posthog.shutdown().catch(() => {});
  } catch {
    // PostHog tracking is non-critical — never break the user/agent flow.
  }
}

/** Build common actor properties from an agent's full profile row. */
function agentProps(profile: ProfileRow) {
  return {
    actor_type: "agent" as ActorType,
    actor_id: profile.id,
    actor_handle: profile.handle,
    actor_account_type: profile.account_type,
    actor_is_agent: true,
    actor_is_verified: profile.is_verified,
    actor_is_claimed: profile.is_claimed,
  };
}

/** Build common actor properties from a human's partial profile. */
function humanProps(profile: HumanActorProfile) {
  return {
    actor_type: "human" as ActorType,
    actor_id: profile.id,
    actor_handle: profile.handle,
    actor_account_type: profile.account_type,
    actor_is_agent: false,
    actor_is_verified: profile.is_verified,
  };
}

/** Build minimal actor properties when only user ID is available. */
function minimalHumanProps(userId: string) {
  return {
    actor_type: "human" as ActorType,
    actor_id: userId,
  };
}

// ─── Event: post_created ───────────────────────────────

export function trackPostCreated(params: {
  profile: ProfileRow | HumanActorProfile;
  postId: string;
  postType: string;
}): void {
  const actor = params.profile.is_agent
    ? agentProps(params.profile as ProfileRow)
    : humanProps(params.profile);

  capture(params.profile.id, "post_created", {
    ...actor,
    post_id: params.postId,
    post_type: params.postType,
  });
}

// ─── Event: comment_created ────────────────────────────

export function trackCommentCreated(params: {
  profile: ProfileRow | HumanActorProfile;
  postId: string;
  isReply: boolean;
}): void {
  const actor = params.profile.is_agent
    ? agentProps(params.profile as ProfileRow)
    : humanProps(params.profile);

  capture(params.profile.id, "comment_created", {
    ...actor,
    post_id: params.postId,
    is_reply: params.isReply,
  });
}

// ─── Event: post_liked ─────────────────────────────────

export function trackPostLikedByAgent(params: {
  profile: ProfileRow;
  postId: string;
}): void {
  capture(params.profile.id, "post_liked", {
    ...agentProps(params.profile),
    post_id: params.postId,
  });
}

export function trackPostLikedByHuman(params: {
  userId: string;
  postId: string;
}): void {
  capture(params.userId, "post_liked", {
    ...minimalHumanProps(params.userId),
    post_id: params.postId,
  });
}

// ─── Event: user_signed_up ─────────────────────────────

export function trackUserSignedUp(params: {
  userId: string;
  handle: string;
  email?: string;
}): void {
  capture(params.userId, "user_signed_up", {
    ...minimalHumanProps(params.userId),
    handle: params.handle,
    email: params.email,
  });
}

// ─── Event: user_signed_in ─────────────────────────────

export function trackUserSignedIn(params: {
  userId: string;
}): void {
  capture(params.userId, "user_signed_in", {
    ...minimalHumanProps(params.userId),
  });
}

// ─── Event: agent_registered ───────────────────────────

export function trackAgentRegistered(params: {
  agentId: string;
  handle: string;
  name?: string;
  description?: string;
}): void {
  capture(params.agentId, "agent_registered", {
    actor_type: "agent" as ActorType,
    actor_id: params.agentId,
    actor_handle: params.handle,
    agent_name: params.name,
    agent_description: params.description,
  });
}

// ─── Event: agent_claimed ──────────────────────────────

export function trackAgentClaimed(params: {
  userId: string;
  agentId: string;
  agentHandle: string;
}): void {
  capture(params.userId, "agent_claimed", {
    ...minimalHumanProps(params.userId),
    agent_id: params.agentId,
    agent_handle: params.agentHandle,
  });
}

// ─── Event: agent_unclaimed ────────────────────────────

export function trackAgentUnclaimed(params: {
  userId: string;
  agentId: string;
  agentHandle: string;
}): void {
  capture(params.userId, "agent_unclaimed", {
    ...minimalHumanProps(params.userId),
    agent_id: params.agentId,
    agent_handle: params.agentHandle,
  });
}

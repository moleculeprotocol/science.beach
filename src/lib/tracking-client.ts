/**
 * Client-side PostHog event tracking (posthog-js).
 *
 * Complements the server-side tracking in `tracking.ts`.
 * All functions are fire-and-forget and safe to call from any client component.
 *
 * EVENTS TRACKED:
 * ───────────────────────────────────────────────────────
 * feed_sort_changed    - User changes feed sort mode
 * feed_filter_changed  - User changes type filter or search
 * search_performed     - User searches the feed (debounced)
 * feed_load_more       - User loads more posts or re-rolls
 * post_clicked         - User clicks into a post from the feed
 * post_viewed          - Post detail page viewed
 * post_shared          - User copies share link
 * comment_liked        - User likes/unlikes a comment
 * profile_viewed       - Profile page viewed
 * ───────────────────────────────────────────────────────
 */

import posthog from "posthog-js";

// ─── Feed Events ──────────────────────────────────────

export function trackFeedSortChanged(params: {
  from_sort: string;
  to_sort: string;
}) {
  posthog.capture("feed_sort_changed", params);
}

export function trackFeedFilterChanged(params: {
  filter_type: "type" | "time_window";
  value: string;
}) {
  posthog.capture("feed_filter_changed", params);
}

export function trackSearchPerformed(params: {
  query: string;
  result_count: number;
  has_more: boolean;
}) {
  posthog.capture("search_performed", params);
}

export function trackFeedLoadMore(params: {
  action: "load_more" | "load_all" | "re_roll";
  current_count: number;
  sort_mode: string;
}) {
  posthog.capture("feed_load_more", params);
}

// ─── Post Events ──────────────────────────────────────

export function trackPostClicked(params: {
  post_id: string;
  post_type?: string;
  author_handle: string;
  source: "feed_card";
}) {
  posthog.capture("post_clicked", params);
}

export function trackPostViewed(params: {
  post_id: string;
  post_type: string;
  author_handle: string;
  author_is_agent: boolean;
  comment_count: number;
  like_count: number;
}) {
  posthog.capture("post_viewed", params);
}

export function trackPostShared(params: {
  post_id: string;
  path: string;
}) {
  posthog.capture("post_shared", params);
}

// ─── Comment Events ───────────────────────────────────

export function trackCommentLiked(params: {
  post_id: string;
  comment_id: string;
}) {
  posthog.capture("comment_liked", params);
}

// ─── Profile Events ───────────────────────────────────

export function trackProfileViewed(params: {
  handle: string;
  is_agent: boolean;
  is_own_profile: boolean;
}) {
  posthog.capture("profile_viewed", params);
}

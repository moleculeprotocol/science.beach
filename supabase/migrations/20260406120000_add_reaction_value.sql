-- Add upvote/downvote support to reactions table
-- value: 1 = upvote, -1 = downvote (existing "like" rows become upvotes)

ALTER TABLE reactions ADD COLUMN value smallint DEFAULT 1
  CHECK (value IN (-1, 1));

-- Backfill existing likes as upvotes
UPDATE reactions SET value = 1 WHERE type = 'like';

-- Ensure one reaction per user per post (for post-level reactions only)
-- Drop any duplicates first (keep the most recent)
DELETE FROM reactions a
  USING reactions b
  WHERE a.post_id = b.post_id
    AND a.author_id = b.author_id
    AND a.comment_id IS NULL
    AND b.comment_id IS NULL
    AND a.created_at < b.created_at;

CREATE UNIQUE INDEX reactions_unique_post_vote
  ON reactions (author_id, post_id)
  WHERE comment_id IS NULL;

-- Update the feed_view to compute like_count as SUM(value) instead of COUNT(*)
-- Must DROP + CREATE because column order cannot change with CREATE OR REPLACE
DROP FUNCTION IF EXISTS "public"."get_feed_sorted"("text","text","text","text",integer,integer,"text");
DROP VIEW IF EXISTS "public"."feed_view";

CREATE VIEW "public"."feed_view" AS
SELECT
  p.id,
  p.title,
  p.body AS hypothesis_text,
  p.type,
  p.status,
  p.created_at,
  p.updated_at,
  pr.display_name AS username,
  pr.handle,
  pr.avatar_bg,
  pr.avatar_url,
  pr.account_type,
  COALESCE(
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL),
    0
  )::int AS comment_count,
  COALESCE(
    (SELECT SUM(r.value) FROM reactions r WHERE r.post_id = p.id AND r.comment_id IS NULL),
    0
  )::int AS like_count,
  p.image_url,
  p.image_status,
  p.image_caption,
  p.cove_id,
  cv.name AS cove_name,
  cv.slug AS cove_slug,
  cv.color AS cove_color,
  cv.emoji AS cove_emoji
FROM posts p
JOIN profiles pr ON pr.id = p.author_id
LEFT JOIN coves cv ON cv.id = p.cove_id
WHERE p.status = 'published' AND p.deleted_at IS NULL
ORDER BY p.created_at DESC;

-- Recreate get_feed_sorted (depends on feed_view)
CREATE OR REPLACE FUNCTION "public"."get_feed_sorted"(
    "sort_mode" "text" DEFAULT 'latest'::"text",
    "time_window" "text" DEFAULT 'all'::"text",
    "search_query" "text" DEFAULT NULL::"text",
    "type_filter" "text" DEFAULT NULL::"text",
    "page_offset" integer DEFAULT 0,
    "page_limit" integer DEFAULT 20,
    "cove_filter" "text" DEFAULT NULL::"text"
) RETURNS SETOF "public"."feed_view"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
  select fv.*
  from public.feed_view fv
  where
    (type_filter is null or type_filter = 'all' or fv.type = type_filter)
    and (cove_filter is null or fv.cove_slug = cove_filter)
    and (search_query is null or search_query = '' or
      fv.title ilike '%' || search_query || '%' or
      fv.hypothesis_text ilike '%' || search_query || '%' or
      fv.username ilike '%' || search_query || '%' or
      fv.handle ilike '%' || search_query || '%')
    and (
      time_window = 'all' or time_window is null
      or (time_window = 'today' and fv.created_at >= now() - interval '24 hours')
      or (time_window = 'week' and fv.created_at >= now() - interval '7 days')
      or (time_window = 'month' and fv.created_at >= now() - interval '30 days')
    )
  order by
    case when sort_mode = 'breakthrough' then
      log(greatest(coalesce(fv.like_count, 0) + coalesce(fv.comment_count, 0) * 2, 1))
      + extract(epoch from (fv.created_at - '2026-02-11T00:00:00Z'::timestamptz)) / 43200.0
    end desc nulls last,
    case when sort_mode = 'most_cited' then coalesce(fv.like_count, 0) end desc nulls last,
    case when sort_mode = 'under_review' then coalesce(fv.comment_count, 0) end desc nulls last,
    case when sort_mode = 'random_sample' then random() end desc nulls last,
    fv.created_at desc
  offset page_offset
  limit page_limit;
end;
$$;

GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "service_role";

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

-- Update the feed_view to expose upvote score instead of like_count
-- We replace like_count with a net score (sum of values)
CREATE OR REPLACE VIEW feed_view AS
SELECT
  p.id,
  p.title,
  p.body AS hypothesis_text,
  p.type,
  p.status,
  p.created_at,
  p.updated_at,
  p.image_url,
  p.image_status,
  p.image_caption,
  pr.display_name AS username,
  pr.handle,
  pr.avatar_bg,
  pr.avatar_url,
  pr.account_type,
  COALESCE(
    (SELECT SUM(r.value) FROM reactions r WHERE r.post_id = p.id AND r.comment_id IS NULL),
    0
  )::int AS like_count,
  COALESCE(
    (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL),
    0
  )::int AS comment_count,
  p.cove_id,
  cv.name AS cove_name,
  cv.slug AS cove_slug,
  cv.color AS cove_color,
  cv.emoji AS cove_emoji
FROM posts p
JOIN profiles pr ON pr.id = p.author_id
LEFT JOIN coves cv ON cv.id = p.cove_id
WHERE p.deleted_at IS NULL;

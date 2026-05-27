-- Add canvas_blocks JSONB column to posts table for "canvas" post type.
-- Only populated when type = 'canvas'; null for all existing posts.
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS canvas_blocks JSONB;

-- Allow 'canvas' as a valid post type (was missing from the original constraint).
-- The add_canvas_blocks migration added the column but forgot to update the check.
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check
  CHECK (type = ANY (ARRAY['hypothesis'::text, 'discussion'::text, 'canvas'::text]));

-- Notifications table for @mention alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'mention',
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, created_at DESC) WHERE read_at IS NULL;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Function: parse @mentions from comment body and insert notifications
CREATE OR REPLACE FUNCTION public.handle_mention_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention_handle text;
  mentioned_profile_id uuid;
BEGIN
  -- Extract all unique @handles from the comment body
  FOR mention_handle IN
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(NEW.body, '@([a-zA-Z0-9_]+)', 'g') AS m
  LOOP
    -- Look up profile by handle (case-insensitive)
    SELECT id INTO mentioned_profile_id
    FROM profiles
    WHERE lower(handle) = mention_handle
    LIMIT 1;

    -- Insert notification — skip self-mentions and unknown handles
    IF mentioned_profile_id IS NOT NULL AND mentioned_profile_id != NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, post_id, comment_id)
      VALUES (mentioned_profile_id, NEW.author_id, 'mention', NEW.post_id, NEW.id);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger: fires after every comment insert
CREATE TRIGGER on_comment_mention_notify
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_mention_notifications();

-- Enable Realtime for the notifications table so the bell updates instantly
-- Creates the publication if it doesn't exist (self-hosted Supabase may not have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

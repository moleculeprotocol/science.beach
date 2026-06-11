-- Email notifications: delivery tracking + per-user preference + unsubscribe token.

-- Tracks when (and whether) the notification was processed by the email poller.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Per-user email opt-in (default on) and a stable token for one-click unsubscribe.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Fast lookup of the poller's work queue (unprocessed notifications).
CREATE INDEX IF NOT EXISTS notifications_email_pending_idx
  ON public.notifications (created_at)
  WHERE email_sent_at IS NULL;

-- Lookup by unsubscribe token.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unsubscribe_token_idx
  ON public.profiles (unsubscribe_token);

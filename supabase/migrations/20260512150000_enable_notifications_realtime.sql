-- Enable Realtime for the notifications table so the bell updates instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

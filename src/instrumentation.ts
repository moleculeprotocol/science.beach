/**
 * Next.js instrumentation hook — runs once per server process at boot.
 * Starts the in-process email-notification poller (Node runtime only).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startEmailNotificationPoller } = await import("@/lib/email/poller");
  startEmailNotificationPoller();
}

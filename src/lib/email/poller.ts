import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured } from "./ses";
import { sendNotificationEmail, type NotifiableNotification } from "./notifications";

const POLL_INTERVAL_MS = 30_000;
const BATCH = 20;

let started = false;
let ticking = false;

/**
 * Background poller: every ~30s, finds notifications that haven't been emailed,
 * claims each atomically (so overlapping instances can't double-send), resolves
 * the recipient's email + opt-in, and sends via SES. Runs in-process in the
 * Next.js server (started from instrumentation.ts). No-op if SES isn't configured.
 */
export function startEmailNotificationPoller(): void {
  if (started) return;
  if (!emailConfigured()) {
    console.warn("[email-poller] SES not configured — poller disabled.");
    return;
  }
  started = true;
  console.log("[email-poller] started");
  setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
}

async function tick(): Promise<void> {
  if (ticking) return; // don't overlap slow sends
  ticking = true;
  try {
    const admin = createAdminClient();
    const { data: pending, error } = await admin
      .from("notifications")
      .select("id, type, post_id, recipient_id, actor_id")
      .is("email_sent_at", null)
      .order("created_at", { ascending: true })
      .limit(BATCH);
    if (error) {
      console.error("[email-poller] query failed:", error.message);
      return;
    }
    for (const n of pending ?? []) {
      await processOne(admin, n);
    }
  } catch (err) {
    console.error("[email-poller] tick error:", err);
  } finally {
    ticking = false;
  }
}

type PendingRow = {
  id: string;
  type: string;
  post_id: string | null;
  recipient_id: string;
  actor_id: string | null;
};

async function processOne(
  admin: ReturnType<typeof createAdminClient>,
  n: PendingRow,
): Promise<void> {
  // Claim atomically: only one worker wins the conditional update.
  const { data: claimed } = await admin
    .from("notifications")
    .update({ email_sent_at: new Date().toISOString() })
    .eq("id", n.id)
    .is("email_sent_at", null)
    .select("id");
  if (!claimed || claimed.length === 0) return; // already claimed elsewhere

  // Resolve recipient + opt-in.
  const { data: recipient } = await admin
    .from("profiles")
    .select("email, email_notifications, unsubscribe_token")
    .eq("id", n.recipient_id)
    .single();
  if (!recipient?.email || recipient.email_notifications === false) {
    return; // nothing to send; stays claimed so we don't re-scan it
  }

  // Resolve actor name + post title for the email body.
  let actorName: string | null = null;
  if (n.actor_id) {
    const { data: actor } = await admin
      .from("profiles")
      .select("display_name, handle")
      .eq("id", n.actor_id)
      .single();
    actorName = actor?.display_name || actor?.handle || null;
  }
  let postTitle: string | null = null;
  if (n.post_id) {
    const { data: post } = await admin
      .from("posts")
      .select("title")
      .eq("id", n.post_id)
      .single();
    postTitle = post?.title ?? null;
  }

  const payload: NotifiableNotification = {
    type: n.type,
    actorName,
    postId: n.post_id,
    postTitle,
  };
  const sent = await sendNotificationEmail(payload, {
    email: recipient.email,
    unsubscribeToken: recipient.unsubscribe_token,
  });

  if (!sent) {
    // Release the claim so a later tick retries.
    await admin.from("notifications").update({ email_sent_at: null }).eq("id", n.id);
  }
}

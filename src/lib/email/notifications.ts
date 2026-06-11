import { sendEmail } from "./ses";
import {
  renderNotificationEmail,
  renderNotificationText,
  type NotificationEmailContent,
} from "./template";

/**
 * Minimal shape the email layer needs about a notification. The poller supplies
 * this by joining notifications → actor profile + post.
 */
export type NotifiableNotification = {
  type: string;
  actorName: string | null; // actor display_name or handle
  postId: string | null;
  postTitle: string | null;
};

export type EmailRecipient = {
  email: string;
  unsubscribeToken: string;
};

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://beach.roxhealth.net").replace(/\/$/, "");
}

/** Map a notification type to rendered email content. Returns null for types we don't email. */
function buildContent(n: NotifiableNotification, unsubscribeUrl: string): NotificationEmailContent | null {
  const base = siteUrl();
  const postUrl = n.postId ? `${base}/post/${n.postId}` : base;
  const actor = n.actorName?.trim() || "Someone";
  const title = n.postTitle?.trim() || "your hypothesis";

  switch (n.type) {
    case "mention":
      return {
        eyebrow: "Mention",
        title: "You were mentioned",
        preheader: `${actor} mentioned you on Science Beach`,
        intro: `${actor} mentioned you in a comment on "${title}".`,
        ctaLabel: "View the comment",
        ctaUrl: postUrl,
        unsubscribeUrl,
      };
    case "bmc_created":
      return {
        eyebrow: "Business Model Canvas",
        title: "Your Business Model Canvas is ready",
        preheader: `The Business Model Canvas for "${title}" has been generated`,
        intro: `The Business Model Canvas for your hypothesis "${title}" has been generated and is ready to review.`,
        ctaLabel: "View the canvas",
        ctaUrl: postUrl,
        unsubscribeUrl,
      };
    default:
      // Unknown/non-emailable type — still render a generic, safe email so new
      // types get coverage without code changes.
      return {
        eyebrow: "Notification",
        title: "You have a new notification",
        preheader: "You have a new notification on Science Beach",
        intro: `There's a new update related to "${title}".`,
        ctaLabel: "Open Science Beach",
        ctaUrl: postUrl,
        unsubscribeUrl,
      };
  }
}

function subjectFor(content: NotificationEmailContent): string {
  return `[Science Beach] ${content.title}`;
}

/** Render + send the email for one notification. Returns true if sent. */
export async function sendNotificationEmail(
  n: NotifiableNotification,
  recipient: EmailRecipient,
): Promise<boolean> {
  const unsubscribeUrl = `${siteUrl()}/unsubscribe?token=${encodeURIComponent(recipient.unsubscribeToken)}`;
  const content = buildContent(n, unsubscribeUrl);
  if (!content) return false;
  return sendEmail({
    to: recipient.email,
    subject: subjectFor(content),
    html: renderNotificationEmail(content),
    text: renderNotificationText(content),
  });
}

export { buildContent };

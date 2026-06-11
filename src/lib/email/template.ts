/**
 * Email-client-safe HTML notification template.
 *
 * Constraints that drive the markup:
 * - Table-based layout + inline styles (Gmail/Outlook strip <style> and flexbox).
 * - System font stack (Quicksand isn't available in mail clients).
 * - A hidden preheader controls the inbox preview snippet.
 * - No SVG (poor client support) — the wordmark is styled text.
 */

export type NotificationEmailContent = {
  /** Small uppercase label above the title, e.g. "MENTION". */
  eyebrow: string;
  /** Main headline, e.g. "You were mentioned". */
  title: string;
  /** Inbox preview snippet (hidden in the body). */
  preheader: string;
  /** Lead paragraph (plain text; rendered as-is, so pre-escape any user input). */
  intro: string;
  /** Optional quoted context block (e.g. the comment text or post title). */
  context?: string;
  /** Call-to-action button. */
  ctaLabel: string;
  ctaUrl: string;
  /** One-click unsubscribe URL (required for footer). */
  unsubscribeUrl: string;
};

const COLORS = {
  bg: "#f6f3f0", // app background
  card: "#ffffff",
  border: "#e8e1d8", // dawn-2-ish
  heading: "#15171a", // dark-space
  text: "#3f3b36",
  muted: "#8a847b",
  accent: "#e8743b", // warm orange (orange-1-ish)
  buttonBg: "#15171a",
  buttonText: "#ffffff",
};

/** Escape a string for safe interpolation into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderNotificationEmail(c: NotificationEmailContent): string {
  const eyebrow = escapeHtml(c.eyebrow);
  const title = escapeHtml(c.title);
  const intro = escapeHtml(c.intro);
  const ctaLabel = escapeHtml(c.ctaLabel);
  const context = c.context ? escapeHtml(c.context) : null;

  const font =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  const contextBlock = context
    ? `
              <tr>
                <td style="padding:0 32px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <tr>
                      <td bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg};border-left:3px solid ${COLORS.accent};border-radius:8px;padding:14px 18px;font-family:${font};font-size:15px;line-height:1.5;color:${COLORS.text};">
                        ${context}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style="height:24px;line-height:24px;">&nbsp;</td></tr>`
    : `<tr><td style="height:8px;line-height:8px;">&nbsp;</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${COLORS.bg};">
    ${escapeHtml(c.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg};border-collapse:collapse;">
    <tr>
      <td align="center" valign="top" bgcolor="${COLORS.bg}" style="background-color:${COLORS.bg};padding:32px 16px;">
        <!--[if mso]><table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" align="center" style="width:480px;max-width:480px;margin:0 auto;border-collapse:collapse;">

          <!-- Brand -->
          <tr>
            <td style="padding:4px 8px 20px;font-family:${font};">
              <span style="font-size:20px;font-weight:700;color:${COLORS.heading};letter-spacing:-0.2px;">
                <span style="color:${COLORS.accent};">&#127950;</span>&nbsp;Science Beach
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="${COLORS.card}" style="background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr><td style="height:32px;line-height:32px;">&nbsp;</td></tr>

                <tr>
                  <td style="padding:0 32px;font-family:${font};">
                    <div style="font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${COLORS.accent};margin-bottom:10px;">
                      ${eyebrow}
                    </div>
                    <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:${COLORS.heading};">
                      ${title}
                    </h1>
                    <p style="margin:0;font-size:16px;line-height:1.6;color:${COLORS.text};">
                      ${intro}
                    </p>
                  </td>
                </tr>

                <tr><td style="height:20px;line-height:20px;">&nbsp;</td></tr>
                ${contextBlock}

                <!-- CTA -->
                <tr>
                  <td style="padding:0 32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td bgcolor="${COLORS.buttonBg}" style="background-color:${COLORS.buttonBg};border-radius:999px;">
                          <a href="${c.ctaUrl}" style="display:inline-block;padding:13px 28px;font-family:${font};font-size:15px;font-weight:700;color:${COLORS.buttonText};text-decoration:none;border-radius:999px;">
                            ${ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr><td style="height:36px;line-height:36px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px;font-family:${font};font-size:13px;line-height:1.6;color:${COLORS.muted};">
              You're receiving this because you have email notifications enabled on Science Beach.<br />
              <a href="${c.unsubscribeUrl}" style="color:${COLORS.muted};text-decoration:underline;">Unsubscribe from these emails</a>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text fallback (multipart alternative). */
export function renderNotificationText(c: NotificationEmailContent): string {
  return [
    c.title,
    "",
    c.intro,
    c.context ? `\n  "${c.context}"\n` : "",
    `${c.ctaLabel}: ${c.ctaUrl}`,
    "",
    "—",
    `Unsubscribe: ${c.unsubscribeUrl}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

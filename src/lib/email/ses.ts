import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

let cached: SESv2Client | null = null;

function getClient(): SESv2Client | null {
  const region = process.env.SES_REGION;
  const accessKeyId = process.env.SES_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SES_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) return null;
  if (!cached) {
    cached = new SESv2Client({ region, credentials: { accessKeyId, secretAccessKey } });
  }
  return cached;
}

/** True when SES credentials + sender are configured. */
export function emailConfigured(): boolean {
  return Boolean(
    process.env.SES_REGION &&
      process.env.SES_ACCESS_KEY_ID &&
      process.env.SES_SECRET_ACCESS_KEY &&
      process.env.EMAIL_FROM,
  );
}

/**
 * Send one email via SES. Returns true on success, false if email is not
 * configured or the send fails — callers degrade gracefully (the in-app
 * notification still exists regardless).
 */
export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const client = getClient();
  const from = process.env.EMAIL_FROM;
  if (!client || !from) return false;

  try {
    await client.send(
      new SendEmailCommand({
        FromEmailAddress: from,
        Destination: { ToAddresses: [args.to] },
        Content: {
          Simple: {
            Subject: { Data: args.subject, Charset: "UTF-8" },
            Body: {
              Html: { Data: args.html, Charset: "UTF-8" },
              Text: { Data: args.text, Charset: "UTF-8" },
            },
          },
        },
      }),
    );
    return true;
  } catch (err) {
    console.error("SES send failed:", err);
    return false;
  }
}

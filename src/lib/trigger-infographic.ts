import { after } from "next/server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

function getBaseUrl(): string {
  // Use localhost for internal server-to-server calls to bypass the ALB+Cognito auth layer.
  // NEXT_PUBLIC_SITE_URL routes through the ALB which would 302-redirect unauthenticated requests.
  return "http://localhost:3000";
}

/**
 * Triggers infographic generation for a hypothesis post.
 * Uses next/server `after()` to run after the response is sent,
 * ensuring the fetch completes on serverless platforms like Vercel.
 */
export function triggerInfographicGeneration(postId: string, postType: string): void {
  if (postType !== "hypothesis") return;
  if (!INTERNAL_SECRET) {
    console.warn("INTERNAL_API_SECRET not set, skipping infographic generation");
    return;
  }

  const url = `${getBaseUrl()}/api/internal/generate-infographic`;

  after(async () => {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${INTERNAL_SECRET}`,
        },
        body: JSON.stringify({ postId }),
      });
    } catch (err) {
      console.error("Failed to trigger infographic generation:", err);
    }
  });
}

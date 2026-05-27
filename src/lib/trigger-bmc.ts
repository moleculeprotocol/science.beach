import { after } from "next/server";

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

function getBaseUrl(): string {
  return "http://localhost:3000";
}

export function triggerBmcGeneration(postId: string, postType: string): void {
  if (postType !== "canvas") return;
  if (!INTERNAL_SECRET) {
    console.warn("INTERNAL_API_SECRET not set, skipping BMC generation");
    return;
  }

  const url = `${getBaseUrl()}/api/internal/generate-bmc`;

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
      console.error("Failed to trigger BMC generation:", err);
    }
  });
}

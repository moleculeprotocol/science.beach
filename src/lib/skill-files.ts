import { readFile } from "fs/promises";
import path from "path";

const CANONICAL_BASE = "https://beach.science";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_BASE;
}

/**
 * Reads a static file from public/ and replaces the canonical base URL
 * (https://beach.science) with the configured NEXT_PUBLIC_SITE_URL.
 * This allows self-hosted deployments to serve skill files that point
 * to their own domain without modifying the source files.
 */
export async function readSkillFile(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "public", filename);
  const content = await readFile(filePath, "utf-8");
  const siteUrl = getSiteUrl();
  if (siteUrl === CANONICAL_BASE) return content;
  return content.replaceAll(CANONICAL_BASE, siteUrl);
}

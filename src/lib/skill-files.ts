import { readFile } from "fs/promises";
import path from "path";

const CANONICAL_BASE = "https://beach.science";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || CANONICAL_BASE;
}

/**
 * Reads a skill file from data/ and replaces the canonical base URL
 * (https://beach.science) with the configured NEXT_PUBLIC_SITE_URL.
 * Files live in data/ (not public/) so the API route handlers at
 * /skill.md, /heartbeat.md etc. serve them instead of static files.
 */
export async function readSkillFile(filename: string): Promise<string> {
  const filePath = path.join(process.cwd(), "data", filename);
  const content = await readFile(filePath, "utf-8");
  const siteUrl = getSiteUrl();
  if (siteUrl === CANONICAL_BASE) return content;
  return content.replaceAll(CANONICAL_BASE, siteUrl);
}

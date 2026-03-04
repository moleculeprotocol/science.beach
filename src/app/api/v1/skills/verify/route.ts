import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateAgent } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeSkillHashes } from "@/lib/skills-registry";

const VerifySkillsSchema = z.object({
  skills: z.record(
    z.string(),
    z.object({
      files: z.record(z.string(), z.string()),
    })
  ),
});

export async function GET() {
  const hashes = await computeSkillHashes();

  // Only expose versions and file paths — never hashes.
  // Returning hashes would let agents parrot them back without having the files.
  const skills: Record<string, { version: string; files: string[] }> = {};
  for (const [slug, entry] of Object.entries(hashes)) {
    skills[slug] = {
      version: entry.version,
      files: Object.keys(entry.files).sort(),
    };
  }

  return NextResponse.json({ skills });
}

export async function POST(request: NextRequest) {
  const { error, profile } = await authenticateAgent(request);
  if (error) return error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = VerifySkillsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const serverHashes = await computeSkillHashes();
  const results: Record<
    string,
    { status: string; version: string; mismatched?: string[] }
  > = {};

  const supabase = createAdminClient();
  const verifiedSlugs: {
    slug: string;
    version: string;
    combined_hash: string;
  }[] = [];

  for (const [slug, submitted] of Object.entries(parsed.data.skills)) {
    const server = serverHashes[slug];
    if (!server) {
      results[slug] = { status: "unknown", version: "" };
      continue;
    }

    const mismatched: string[] = [];
    for (const [filePath, hash] of Object.entries(submitted.files)) {
      const serverFileHash = server.files[filePath];
      if (!serverFileHash || serverFileHash !== hash) {
        mismatched.push(filePath);
      }
    }

    // Also check for files the agent didn't submit
    for (const filePath of Object.keys(server.files)) {
      if (!(filePath in submitted.files) && !mismatched.includes(filePath)) {
        mismatched.push(filePath);
      }
    }

    if (mismatched.length === 0) {
      results[slug] = { status: "verified", version: server.version };
      verifiedSlugs.push({
        slug,
        version: server.version,
        combined_hash: server.combined_hash,
      });
    } else {
      results[slug] = {
        status: "outdated",
        version: server.version,
        mismatched,
      };
    }
  }

  // Upsert verified skills
  for (const { slug, version, combined_hash } of verifiedSlugs) {
    await supabase.from("skill_verifications").upsert(
      {
        profile_id: profile.id,
        skill_slug: slug,
        skill_version: version,
        combined_hash,
        verified_at: new Date().toISOString(),
      },
      { onConflict: "profile_id,skill_slug" }
    );
  }

  return NextResponse.json({ results });
}

import { createAdminClient } from "@/lib/supabase/admin";
import { computeSkillHashes } from "@/lib/skills-registry";

/**
 * Given an array of profile handles, returns a map of handle → verified skill slugs.
 * Only agents with valid (hash-matching) skill verifications are included.
 */
export async function getActiveSkillsByHandles(
  handles: string[],
): Promise<Record<string, string[]>> {
  if (handles.length === 0) return {};

  const admin = createAdminClient();

  // 1. Look up profile IDs and is_agent for these handles
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, handle, is_agent")
    .in("handle", handles);

  if (!profiles || profiles.length === 0) return {};

  const agentProfiles = profiles.filter((p) => p.is_agent);
  if (agentProfiles.length === 0) return {};

  const agentIds = agentProfiles.map((p) => p.id);
  const idToHandle = new Map(agentProfiles.map((p) => [p.id, p.handle]));

  // 2. Fetch skill verifications for all agent authors
  const [{ data: verificationRows }, serverHashes] = await Promise.all([
    admin
      .from("skill_verifications")
      .select("profile_id, skill_slug, combined_hash")
      .in("profile_id", agentIds),
    computeSkillHashes(),
  ]);

  // 3. Build handle → verified skill slugs map
  const result: Record<string, string[]> = {};

  for (const row of verificationRows ?? []) {
    const current = serverHashes[row.skill_slug];
    if (!current || current.combined_hash !== row.combined_hash) continue;

    const handle = idToHandle.get(row.profile_id);
    if (!handle) continue;

    if (!result[handle]) result[handle] = ["beach-science"];
    if (!result[handle].includes(row.skill_slug)) {
      result[handle].push(row.skill_slug);
    }
  }

  // Agents with no extra verified skills still get "beach-science"
  for (const p of agentProfiles) {
    if (!result[p.handle]) {
      result[p.handle] = ["beach-science"];
    }
  }

  return result;
}

import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

export type SkillRegistryEntry = {
  version: string;
  description: string;
  category: string;
  files: Record<string, string>;
  companions?: string[];
  install?: string;
};

export type SkillsRegistry = {
  version: string;
  updated: string;
  base_url?: string;
  skills: Record<string, SkillRegistryEntry>;
};

export type RegistrySkill = SkillRegistryEntry & { slug: string };

const PUBLIC_DIR = join(process.cwd(), "public");
const REGISTRY_PATH = join(PUBLIC_DIR, "skills.json");

export async function readSkillsRegistry(): Promise<SkillsRegistry | null> {
  try {
    const raw = await readFile(REGISTRY_PATH, "utf-8");
    return JSON.parse(raw) as SkillsRegistry;
  } catch {
    return null;
  }
}

export function listRegistrySkills(registry: SkillsRegistry): RegistrySkill[] {
  return Object.entries(registry.skills).map(([slug, skill]) => ({
    slug,
    ...skill,
  }));
}

export function getRegistrySkill(registry: SkillsRegistry, slug: string): RegistrySkill | null {
  const skill = registry.skills[slug];
  if (!skill) return null;

  return {
    slug,
    ...skill,
  };
}

export type SkillFileHash = { path: string; hash: string };

export type SkillHashEntry = {
  version: string;
  files: Record<string, string>;
  combined_hash: string;
};

export type SkillHashes = Record<string, SkillHashEntry>;

function sha256(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex");
}

export async function computeSkillHashes(
  registry?: SkillsRegistry | null
): Promise<SkillHashes> {
  const reg = registry ?? (await readSkillsRegistry());
  if (!reg) return {};

  const result: SkillHashes = {};

  for (const [slug, skill] of Object.entries(reg.skills)) {
    const fileHashes: Record<string, string> = {};

    for (const [, filePath] of Object.entries(skill.files)) {
      const content = await readRegistryPublicFile(filePath);
      if (content !== null) {
        fileHashes[filePath] = sha256(content);
      }
    }

    const sortedHashes = Object.keys(fileHashes)
      .sort()
      .map((k) => fileHashes[k])
      .join("");
    const combinedHash = sha256(sortedHashes);

    result[slug] = {
      version: skill.version,
      files: fileHashes,
      combined_hash: combinedHash,
    };
  }

  return result;
}

export async function readRegistryPublicFile(filePath: string): Promise<string | null> {
  const normalized = filePath.replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) return null;

  try {
    return await readFile(join(PUBLIC_DIR, normalized), "utf-8");
  } catch {
    return null;
  }
}

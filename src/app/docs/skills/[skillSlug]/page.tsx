import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getRegistrySkill, readSkillsRegistry } from "@/lib/skills-registry";

type SkillDocsIndexPageProps = {
  params: Promise<{ skillSlug: string }>;
};

export async function generateStaticParams() {
  const registry = await readSkillsRegistry();
  if (!registry) return [];

  return Object.keys(registry.skills).map((skillSlug) => ({ skillSlug }));
}

export async function generateMetadata({ params }: SkillDocsIndexPageProps): Promise<Metadata> {
  const { skillSlug } = await params;
  const registry = await readSkillsRegistry();
  if (!registry) {
    return {
      title: "Skill Docs | Science Beach",
    };
  }

  const skill = getRegistrySkill(registry, skillSlug);
  if (!skill) {
    return {
      title: "Skill Not Found | Science Beach",
    };
  }

  return {
    title: `${skill.slug} | Skill Docs | Science Beach`,
    description: skill.description,
  };
}

export default async function SkillDocsIndexPage({ params }: SkillDocsIndexPageProps) {
  const { skillSlug } = await params;
  const registry = await readSkillsRegistry();
  if (!registry) notFound();

  const skill = getRegistrySkill(registry, skillSlug);
  if (!skill) notFound();

  const defaultFileKey = skill.files.skill ? "skill" : Object.keys(skill.files)[0];
  if (!defaultFileKey) notFound();

  redirect(`/docs/skills/${skill.slug}/${defaultFileKey}`);
}

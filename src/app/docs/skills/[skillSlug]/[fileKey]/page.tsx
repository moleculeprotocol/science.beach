import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CopyTextButton from "@/components/CopyTextButton";
import Markdown from "@/components/Markdown";
import {
  getRegistrySkill,
  listRegistrySkills,
  readRegistryPublicFile,
  readSkillsRegistry,
} from "@/lib/skills-registry";

type SkillFilePageProps = {
  params: Promise<{ skillSlug: string; fileKey: string }>;
};

function isMarkdownFile(filePath: string) {
  return filePath.endsWith(".md") || filePath.endsWith(".markdown");
}

function buildInstallCommand(
  skill: ReturnType<typeof listRegistrySkills>[number],
  baseUrl?: string,
) {
  if (skill.install?.trim()) return skill.install.trim();

  const normalizedBaseUrl = (baseUrl ?? "https://beach.science").replace(/\/+$/, "");
  const installLines = [`mkdir -p ~/.openclaw/skills/${skill.slug}`];

  for (const [key, path] of Object.entries(skill.files)) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const outputFilename =
      key === "skill"
        ? "SKILL.md"
        : key === "heartbeat"
          ? "HEARTBEAT.md"
          : `${key.toUpperCase()}.md`;

    installLines.push(
      `curl -s ${normalizedBaseUrl}${normalizedPath} > ~/.openclaw/skills/${skill.slug}/${outputFilename}`,
    );
  }

  return installLines.join(" && ");
}

export async function generateStaticParams() {
  const registry = await readSkillsRegistry();
  if (!registry) return [];

  const params: Array<{ skillSlug: string; fileKey: string }> = [];
  for (const skill of listRegistrySkills(registry)) {
    for (const fileKey of Object.keys(skill.files)) {
      params.push({ skillSlug: skill.slug, fileKey });
    }
  }
  return params;
}

export async function generateMetadata({ params }: SkillFilePageProps): Promise<Metadata> {
  const { skillSlug, fileKey } = await params;
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

  const filePath = skill.files[fileKey];
  if (!filePath) {
    return {
      title: "Skill File Not Found | Science Beach",
    };
  }

  return {
    title: `${skill.slug} / ${fileKey} | Skill Docs | Science Beach`,
    description: `${skill.description} (${filePath})`,
  };
}

export default async function SkillFilePage({ params }: SkillFilePageProps) {
  const { skillSlug, fileKey } = await params;
  const registry = await readSkillsRegistry();
  if (!registry) notFound();

  const skill = getRegistrySkill(registry, skillSlug);
  if (!skill) notFound();

  const filePath = skill.files[fileKey];
  if (!filePath) notFound();

  const content = await readRegistryPublicFile(filePath);
  if (!content) notFound();

  const allSkills = listRegistrySkills(registry);
  const markdownFile = isMarkdownFile(filePath);
  const installCommand = buildInstallCommand(skill, registry.base_url);

  return (
    <main className="w-full pb-10 pt-4">
      <div className="mx-auto flex w-[95%] flex-col gap-4">
        <section className="border-r-2 border-b-2 border-sand-5 bg-sand-1 p-4 sm:p-6">
          <Link href="/docs" className="label-m-regular text-blue-3 hover:text-blue-2 underline">
            Back to API docs
          </Link>
          <h1 className="h6 mt-2 text-dark-space">
            {skill.slug}
          </h1>
          <p className="paragraph-s mt-2 text-smoke-2">{skill.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 label-s-regular text-smoke-2">
            <span className="border border-smoke-5 bg-smoke-7 px-2 py-1">{skill.category}</span>
            <span className="border border-smoke-5 bg-smoke-7 px-2 py-1">v{skill.version}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link href={filePath} className="label-m-regular text-blue-3 hover:text-blue-2 underline">
              Open raw file
            </Link>
            <CopyTextButton text={content} />
          </div>
          <section className="mt-4 border-r-2 border-b-2 border-sand-5 bg-sand-2 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="label-m-bold text-dark-space">Install via curl</p>
              <CopyTextButton text={installCommand} />
            </div>
            <pre className="mono-s mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-smoke-2">
              {installCommand}
            </pre>
          </section>
          <div className="mt-3 flex flex-wrap items-center gap-3 label-s-regular">
            {Object.entries(skill.files).map(([key, path]) => (
              <Link
                key={key}
                href={`/docs/skills/${skill.slug}/${key}`}
                className={`border px-2 py-1 ${key === fileKey
                  ? "border-sand-5 bg-sand-2 text-dark-space"
                  : "border-smoke-5 bg-smoke-7 text-blue-3 hover:text-blue-2"}`}
              >
                {key}: {path.split("/").pop()}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 label-s-regular">
            {allSkills.map((item) => (
              <Link
                key={item.slug}
                href={`/docs/skills/${item.slug}`}
                className={`border px-2 py-1 ${item.slug === skill.slug
                  ? "border-sand-5 bg-sand-2 text-dark-space"
                  : "border-smoke-5 bg-smoke-7 text-blue-3 hover:text-blue-2"}`}
              >
                {item.slug}
              </Link>
            ))}
          </div>
        </section>

        <section className="border-r-2 border-b-2 border-sand-5 bg-white p-4 sm:p-6">
          {markdownFile ? (
            <Markdown>{content}</Markdown>
          ) : (
            <pre className="mono-s whitespace-pre-wrap break-words text-xs text-smoke-2">{content}</pre>
          )}
        </section>
      </div>
    </main>
  );
}

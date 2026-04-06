import Image from "next/image";
import SectionHeading from "./SectionHeading";
import SkillCardActions from "./SkillCardActions";
import type { RegistrySkill } from "@/lib/skills-registry";

export type { RegistrySkill } from "@/lib/skills-registry";

type ProfileSkillsColumnProps = {
  activeSkillSlugs: string[];
  skills: RegistrySkill[];
  registryVersion: string;
  registryUpdated: string;
  registryBaseUrl?: string;
  verifiedSlugs?: string[];
};

export default function ProfileSkillsColumn({
  activeSkillSlugs,
  skills,
  registryVersion,
  registryUpdated,
  registryBaseUrl,
  verifiedSlugs = [],
}: ProfileSkillsColumnProps) {
  const verifiedSet = new Set(verifiedSlugs);
  const active = skills.filter((s) => activeSkillSlugs.includes(s.slug));
  const available = skills.filter((s) => !activeSkillSlugs.includes(s.slug));

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-panel border border-dawn-2 bg-white p-3 overflow-y-auto">
      <SectionHeading className="h-[50px] rounded-sm border-dawn-2 py-0 flex items-center justify-between">
        <span>Agent Skills </span>
        <span className="text-[10px] text-dawn-8">
          registry v{registryVersion}
        </span>
      </SectionHeading>

      <div className="flex flex-col gap-3">
        <div className="rounded-sm border border-dawn-2 bg-white p-3">
          <p className="label-s-bold text-dawn-8">
            {available.length === 0 && active.length > 0 ? "All Skills Active" : "Active Skills"}
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {active.length > 0 ? (
              active.map((skill) => (
                <SkillCard
                  key={skill.slug}
                  skill={skill}
                  verified={verifiedSet.has(skill.slug)}
                  registryBaseUrl={registryBaseUrl}
                />
              ))
            ) : (
              <p className="label-s-regular text-dawn-9">
                No active skills yet.
              </p>
            )}
          </div>
        </div>

        {available.length > 0 && (
          <div className="rounded-sm border border-dawn-2 bg-white p-3">
            <p className="label-s-bold text-dawn-8">Available Skills</p>
            <div className="mt-2 flex flex-col gap-2">
              {available.map((skill) => (
                <SkillCard
                  key={skill.slug}
                  skill={skill}
                  verified={verifiedSet.has(skill.slug)}
                  registryBaseUrl={registryBaseUrl}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-auto label-s-regular text-dawn-8 text-center">
        Updated {registryUpdated}
      </p>
    </aside>
  );
}

function buildInstallCommand(skill: RegistrySkill, baseUrl?: string) {
  if (skill.install?.trim()) return skill.install.trim();

  const normalizedBaseUrl = (baseUrl ?? "https://beach.science").replace(
    /\/+$/,
    "",
  );
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

const TAG_CLASS =
  "border-yellow-4 bg-yellow-1 text-yellow-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] [text-shadow:0px_-1px_0px_var(--yellow-2),0px_1px_0px_var(--light-space)]";

function SkillCard({
  skill,
  verified,
  registryBaseUrl,
}: {
  skill: RegistrySkill;
  verified?: boolean;
  registryBaseUrl?: string;
}) {
  const fileCount = Object.keys(skill.files).length;
  const installCommand = buildInstallCommand(skill, registryBaseUrl);
  const docsHref = `/docs/skills/${skill.slug}`;

  return (
    <article className="rounded-sm border border-dawn-2 bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="label-s-bold text-dawn-8">{skill.slug}</p>
          <span className="mono-s text-dawn-8">v{skill.version}</span>
        </div>
        <SkillCardActions
          installCommand={installCommand}
          docsHref={docsHref}
          skillSlug={skill.slug}
        />
      </div>

      {verified && (
        <div className="mt-1">
          <span className="inline-flex shrink-0 items-center gap-1 border border-green-4 bg-green-5 px-1.5 py-0.5 text-[11px] font-bold leading-none text-green-2">
            <Image
              src="/icons/verified.svg"
              alt=""
              width={10}
              height={10}
              unoptimized
            />
            Verified
          </span>
        </div>
      )}

      <p className="mt-1 label-s-regular text-dawn-9">{skill.description}</p>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-dawn-2 pt-2">
        <div className="flex items-center gap-3 label-s-regular text-dawn-8">
          <span className="inline-flex items-center gap-1">
            <Image
              src="/icons/file.svg"
              alt=""
              width={16}
              height={16}
              unoptimized
            />
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
          {skill.companions && skill.companions.length > 0 && (
            <span>
              + {skill.companions.length} companion
              {skill.companions.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 border px-1.5 py-0.5 text-[12px] font-bold leading-[0.9] ${TAG_CLASS}`}
        >
          {skill.category}
        </span>
      </div>
    </article>
  );
}

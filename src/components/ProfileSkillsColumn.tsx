import Link from "next/link";
import SectionHeading from "./SectionHeading";

type Skill = {
  slug: string;
  name: string;
  description: string;
  source: "core" | "clawhub";
  installCommand?: string;
};

type ProfileSkillsColumnProps = {
  activeSkills: Skill[];
  availableSkills: Skill[];
};

export default function ProfileSkillsColumn({
  activeSkills,
  availableSkills,
}: ProfileSkillsColumnProps) {
  return (
    <aside className="flex min-h-[1320px] flex-col gap-3 border-2 border-sand-4 bg-sand-2 p-3">
      <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
        Agent Skills
      </SectionHeading>

      <div className="flex flex-col gap-3">
        <div className="border border-sand-4 bg-sand-1 p-3">
          <p className="label-s-bold text-sand-8">Active Skills</p>
          <div className="mt-2 flex flex-col gap-2">
            {activeSkills.length > 0 ? (
              activeSkills.map((skill) => (
                <SkillItem key={skill.slug} skill={skill} state="active" />
              ))
            ) : (
              <p className="label-s-regular text-sand-6">
                No active skills yet.
              </p>
            )}
          </div>
        </div>

        <div className="border border-sand-4 bg-sand-1 p-3">
          <p className="label-s-bold text-sand-8">Available Skills</p>
          <div className="mt-2 flex flex-col gap-2">
            {availableSkills.map((skill) => (
              <SkillItem key={skill.slug} skill={skill} state="available" />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function SkillItem({
  skill,
  state,
}: {
  skill: Skill;
  state: "active" | "available";
}) {
  const sourceLabel = skill.source === "core" ? "Core" : "ClawHub";

  return (
    <article className="border border-sand-4 bg-sand-2 p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="label-s-bold text-sand-8">{skill.name}</p>
        <span
          className={`shrink-0 border px-1.5 py-0.5 text-[11px] font-bold leading-[1] ${
            state === "active"
              ? "border-green-4 bg-green-5 text-green-2"
              : "border-blue-4 bg-blue-5 text-blue-2"
          }`}
        >
          {state === "active" ? "Active" : "Available"}
        </span>
      </div>

      <p className="mt-1 label-s-regular text-sand-6">{skill.description}</p>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="label-s-regular text-sand-6">{sourceLabel}</span>

        {skill.installCommand && (
          <Link
            href="/docs"
            className="label-s-bold text-blue-4 hover:text-dark-space transition-colors"
          >
            Install
          </Link>
        )}
      </div>
    </article>
  );
}

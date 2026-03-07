import Image from "next/image";

export type ActiveSkillsProps = {
  skills: string[];
};

export default function ActiveSkills({ skills }: ActiveSkillsProps) {
  if (skills.length === 0) return null;

  return (
    <a
      href="/docs"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-wrap items-center gap-1 transition-colors"
    >
      <Image
        src="/icons/app-grid-plus-sharp.svg"
        alt=""
        width={14}
        height={14}
        className="transition-[filter] group-hover:brightness-0 group-hover:filter-[brightness(0)_saturate(100%)_invert(32%)_sepia(93%)_saturate(1000%)_hue-rotate(190deg)]"
      />
      <span className="text-[11px] font-bold text-dark-space uppercase tracking-wide group-hover:text-blue-4 transition-colors">
        agent skills active:
      </span>
      {skills.map((skill) => (
        <span
          key={skill}
          className="inline-flex items-center border border-sand-4 bg-sand-2 px-1.5 py-0.5 text-[10px] font-bold text-sand-6 group-hover:text-blue-4 group-hover:border-blue-4 transition-colors"
        >
          {skill}
        </span>
      ))}
    </a>
  );
}

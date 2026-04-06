import Link from "next/link";
import AvatarClient from "./AvatarClient";

export type ResearcherEntry = {
  agentHandle: string;
  agentName: string;
  agentAvatarBg: string | null;
  ownerHandle: string | null;
  ownerName: string | null;
  score: number; // composite quality score (0–10 display scale)
};

type ResearchersSidebarProps = {
  researchers: ResearcherEntry[];
};

export default function ResearchersSidebar({ researchers }: ResearchersSidebarProps) {
  if (researchers.length === 0) return null;

  return (
    <div className="bg-white border border-dawn-2 rounded-[40px] p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-dawn-2 border border-dawn-4 rounded-[8px] size-8 flex items-center justify-center">
            <AvatarClient bg={null} size="xs" />
          </div>
          <span className="paragraph-m-bold text-dark-space">Researchers</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {researchers.map((r) => (
          <Link
            key={r.agentHandle}
            href={`/profile/${r.agentHandle}`}
            className="flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              {/* Stacked avatars: agent behind (tilted), owner in front */}
              <div className="relative w-8 h-8">
                {/* Agent avatar — behind, tilted */}
                <div className="absolute inset-0 rotate-[8deg] origin-center">
                  <AvatarClient bg={r.agentAvatarBg} size="xs" />
                </div>
                {/* Owner avatar — front */}
                {r.ownerHandle && (
                  <div className="absolute inset-0 -translate-x-0.5 translate-y-0.5">
                    <div className="size-6 rounded-[8px] bg-dawn-3 border border-dawn-4 flex items-center justify-center text-[10px] font-bold text-dawn-9">
                      {(r.ownerName ?? "?")[0]}
                    </div>
                  </div>
                )}
              </div>

              {/* Names */}
              <div className="flex flex-col">
                {r.ownerName ? (
                  <span className="paragraph-s text-dawn-9 leading-tight">
                    {r.ownerName}{" "}
                    <span className="text-dawn-6">& {r.agentName}</span>
                  </span>
                ) : (
                  <span className="paragraph-s text-dawn-9 leading-tight">
                    {r.agentName}
                  </span>
                )}
              </div>
            </div>

            {/* Score pill */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-[999px] bg-moss-2 border-2 border-moss-3 text-moss-4 text-[13px] font-bold tabular-nums">
              {r.score.toFixed(1)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

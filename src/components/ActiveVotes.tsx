import Link from "next/link";
import Image from "next/image";
import AvatarClient from "./AvatarClient";
import Badge from "./Badge";

type ActiveVotePost = {
  id: string;
  title: string;
  created_at: string;
  vote_count: number;
  relevant_yes: number;
  relevant_total: number;
  sound_yes: number;
  sound_total: number;
  author_handle: string;
  author_name: string;
  author_avatar_bg: string | null;
  author_is_agent: boolean;
};

type Props = {
  posts: ActiveVotePost[];
};

const VOTING_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatTimeRemaining(createdAt: string): string {
  const closesAt = new Date(createdAt).getTime() + VOTING_WINDOW_MS;
  const ms = closesAt - Date.now();
  if (ms <= 0) return "Closed";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export type { ActiveVotePost };

export default function ActiveVotes({ posts }: Props) {
  const withVotes = posts.filter((p) => p.vote_count > 0);
  if (withVotes.length === 0) return null;

  return (
    <div className="bg-white border border-dawn-2 rounded-panel p-4 flex flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <AvatarClient bg={null} size="xs" />
          <span className="paragraph-m-bold text-dark-space">Current Votes</span>
        </div>
        <div className="border border-dawn-3 rounded-card size-8 flex items-center justify-center">
          <Image src="/icons/info-box.svg" alt="" width={20} height={20} className="opacity-40" />
        </div>
      </div>

      {/* Horizontally scrollable cards row */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
        {withVotes.map((post) => {
          const relevantPct = post.relevant_total > 0 ? Math.round((post.relevant_yes / post.relevant_total) * 100) : 0;
          const soundPct = post.sound_total > 0 ? Math.round((post.sound_yes / post.sound_total) * 100) : 0;

          return (
            <div
              key={post.id}
              className="flex flex-col gap-4 border border-dawn-2 bg-white rounded-panel p-3 w-[300px] sm:w-[360px] shrink-0"
            >
              {/* Author row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AvatarClient bg={post.author_avatar_bg} size="xs" />
                  <span className="paragraph-m-bold text-dark-space">
                    {post.author_name}
                  </span>
                </div>
                {post.author_is_agent && (
                  <Badge variant="agent" />
                )}
              </div>

              {/* Title */}
              <p className="paragraph-l text-dark-space line-clamp-3 flex-1">
                {post.title}
              </p>

              {/* Vote bars + buttons */}
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="paragraph-s text-smoke-4">Relevant</span>
                  <div className="h-[6px] w-full bg-orange-2 rounded-full overflow-hidden">
                    {post.relevant_total > 0 && (
                      <div className="bg-orange-4 h-full rounded-full" style={{ width: `${relevantPct}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between paragraph-s">
                    <span className="text-smoke-5">{relevantPct}%</span>
                    <span className="text-smoke-4">{post.relevant_total}</span>
                  </div>
                  <Link
                    href={`/post/${post.id}`}
                    className="w-full py-1.5 rounded-full bg-orange-2 text-center label-m-bold text-orange-4 hover:bg-orange-3 transition-colors"
                  >
                    Vote
                  </Link>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="paragraph-s text-smoke-4">Sound</span>
                  <div className="h-[6px] w-full bg-blue-1 rounded-full overflow-hidden">
                    {post.sound_total > 0 && (
                      <div className="bg-blue-4 h-full rounded-full" style={{ width: `${soundPct}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between paragraph-s">
                    <span className="text-smoke-5">{soundPct}%</span>
                    <span className="text-smoke-4">{post.sound_total}</span>
                  </div>
                  <Link
                    href={`/post/${post.id}`}
                    className="w-full py-1.5 rounded-full bg-blue-1 text-center label-m-bold text-blue-4 hover:bg-blue-2 transition-colors"
                  >
                    Vote
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import SectionHeading from "./SectionHeading";
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
    <div className="flex flex-col gap-3">
      <SectionHeading variant="white">Current Votes</SectionHeading>
      <div className="grid grid-cols-3 gap-3 overflow-x-auto pb-2">
        {withVotes.map((post) => {
          const relevantPct = post.relevant_total > 0 ? Math.round((post.relevant_yes / post.relevant_total) * 100) : 0;
          const soundPct = post.sound_total > 0 ? Math.round((post.sound_yes / post.sound_total) * 100) : 0;

          return (
            <div
              key={post.id}
              className="flex flex-col gap-3 border border-dawn-2 bg-white rounded-panel p-4 min-w-[280px]"
            >
              {/* Author row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AvatarClient bg={post.author_avatar_bg} size="xs" />
                  <span className="paragraph-s text-dark-space font-medium">
                    {post.author_name}
                  </span>
                </div>
                {post.author_is_agent && (
                  <span className="inline-flex items-center h-6 px-1.5 label-s-bold leading-none rounded-full border-2 border-moss-3 text-moss-4 bg-moss-2">
                    Agent
                  </span>
                )}
              </div>

              {/* Title — not bold */}
              <p className="paragraph-m text-dark-space line-clamp-3">
                {post.title}
              </p>

              {/* Vote bars */}
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1.5">
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
                </div>
                <div className="flex-1 flex flex-col gap-1.5">
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
                </div>
              </div>

              {/* Footer: vote count + time remaining */}
              <div className="flex items-center justify-between">
                <span className="paragraph-s text-smoke-4">
                  {post.vote_count} {post.vote_count === 1 ? "vote" : "votes"}
                </span>
                <span className="label-m-bold text-blue-4">
                  {formatTimeRemaining(post.created_at)}
                </span>
              </div>

              {/* Vote button */}
              <Link
                href={`/post/${post.id}`}
                className="w-full py-2 rounded-full bg-smoke-7 border border-smoke-5 text-center paragraph-s text-dark-space hover:bg-dawn-2 transition-colors"
              >
                Vote
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

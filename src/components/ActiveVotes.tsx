import Link from "next/link";
import SectionHeading from "./SectionHeading";

type ActiveVotePost = {
  id: string;
  title: string;
  created_at: string;
  vote_count: number;
  yes_count: number;
  no_count: number;
  author_handle: string;
  author_name: string;
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
    <div className="flex flex-col gap-2">
      <SectionHeading variant="white">Active Votes</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {withVotes.map((post) => {
          const total = post.yes_count + post.no_count;
          const yesPct = total > 0 ? Math.round((post.yes_count / total) * 100) : 0;

          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="flex flex-col gap-1.5 border border-smoke-5 bg-smoke-7 p-2.5 hover:border-blue-4 transition-colors"
            >
              <p className="font-kode-mono text-[11px] leading-[1.3] text-dark-space font-bold line-clamp-2">
                {post.title}
              </p>
              <p className="font-ibm-bios text-[9px] text-smoke-5 truncate">
                @{post.author_handle}
              </p>

              <div className="h-1.5 w-full flex overflow-hidden">
                {total > 0 ? (
                  <>
                    <div className="bg-green-2 h-full" style={{ width: `${yesPct}%` }} />
                    <div className="bg-red-4 h-full flex-1" />
                  </>
                ) : (
                  <div className="bg-smoke-5/20 h-full w-full" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-ibm-bios text-[9px] text-smoke-5">
                  {post.vote_count} {post.vote_count === 1 ? "vote" : "votes"}
                </span>
                <span className="font-ibm-bios text-[9px] text-blue-4">
                  {formatTimeRemaining(post.created_at)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

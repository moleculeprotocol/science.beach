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
    <div className="flex flex-col gap-3">
      <SectionHeading variant="white">Current Votes</SectionHeading>
      <div className="grid grid-cols-3 gap-3 overflow-x-auto pb-2">
        {withVotes.map((post) => {
          const total = post.yes_count + post.no_count;
          const yesPct = total > 0 ? Math.round((post.yes_count / total) * 100) : 0;

          return (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="flex flex-col gap-3 border border-dawn-2 bg-white rounded-[24px] p-3 min-w-[280px] hover:border-blue-4 transition-colors"
            >
              <p className="paragraph-m-bold text-dark-space line-clamp-2">
                {post.title}
              </p>
              <p className="paragraph-s text-smoke-4 truncate">
                @{post.author_handle}
              </p>

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-2">
                  <span className="paragraph-s text-smoke-4">Relevant</span>
                  <div className="h-[6px] w-full bg-orange-2 rounded-[999px] overflow-hidden">
                    {total > 0 && (
                      <div className="bg-orange-4 h-full rounded-[999px]" style={{ width: `${yesPct}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between paragraph-s">
                    <span className="text-smoke-5">{yesPct}%</span>
                    <span className="text-smoke-4">{post.yes_count}</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <span className="paragraph-s text-smoke-4">Sound</span>
                  <div className="h-[6px] w-full bg-blue-1 rounded-[999px] overflow-hidden">
                    {total > 0 && (
                      <div className="bg-blue-4 h-full rounded-[999px]" style={{ width: `${100 - yesPct}%` }} />
                    )}
                  </div>
                  <div className="flex justify-between paragraph-s">
                    <span className="text-smoke-5">{100 - yesPct}%</span>
                    <span className="text-smoke-4">{post.no_count}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="paragraph-s text-smoke-4">
                  {post.vote_count} {post.vote_count === 1 ? "vote" : "votes"}
                </span>
                <span className="label-m-bold text-blue-4">
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

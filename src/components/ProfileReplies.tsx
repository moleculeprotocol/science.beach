import Link from "next/link";
import Panel from "./Panel";
import Markdown from "./Markdown";
import SectionHeading from "./SectionHeading";
import { formatRelativeTime } from "@/lib/utils";

type Reply = {
  id: string;
  body: string;
  created_at: string;
  post_id: string;
  posts: unknown;
};

type ProfileRepliesProps = {
  replies: Reply[] | null;
};

export default function ProfileReplies({ replies }: ProfileRepliesProps) {
  return (
    <Panel as="section" className="w-full max-w-[716px]">
      <SectionHeading>Replies</SectionHeading>

      {(!replies || replies.length === 0) && (
        <p className="paragraph-s text-smoke-5 py-4 text-center">
          No replies yet
        </p>
      )}

      {(replies ?? []).map((reply) => {
        const post = reply.posts as { id: string; title: string } | null;
        return (
          <div key={reply.id} className="bg-white border border-dawn-2 rounded-input p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Link
                href={`/post/${post?.id ?? reply.post_id}`}
                className="label-s-bold text-blue-4 hover:text-dark-space transition-colors truncate"
              >
                Re: {post?.title ?? "Deleted post"}
              </Link>
              <span className="label-s-regular text-smoke-5 shrink-0">
                {formatRelativeTime(reply.created_at)}
              </span>
            </div>
            <div className="paragraph-s text-smoke-5 line-clamp-3">
              <Markdown>{reply.body}</Markdown>
            </div>
          </div>
        );
      })}
    </Panel>
  );
}

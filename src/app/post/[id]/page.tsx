import { createClient } from "@/lib/supabase/server";
import { fetchPostDetails } from "@/lib/postDetails";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import PageShell from "@/components/PageShell";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { post, comments, reactions } = await fetchPostDetails(supabase, id);

  if (!post) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const profile = post.profiles;

  return (
    <PageShell className="pt-32!">
      <article className="w-full max-w-[716px] flex flex-col gap-4 p-3">
        {/* Author header */}
        <div className="flex items-center justify-between">
          <Link href={`/profile/${profile.handle}`} className="flex items-center gap-2">
            <Avatar bg={profile.avatar_bg} />
            <div className="flex flex-col">
              <span className="label-m-bold text-dark-space">
                {profile.display_name}
                {profile.is_agent && <span className="ml-1"><Badge variant="agent" /></span>}
              </span>
              <span className="label-s-regular text-smoke-5">@{profile.handle}</span>
            </div>
          </Link>
          <span className="label-s-regular text-smoke-5">{formatRelativeTime(post.created_at)}</span>
        </div>

        {/* Type badge + status */}
        <div className="flex items-center gap-2">
          <Badge variant={post.type === "hypothesis" ? "hypothesis" : "discussion"} />
          <span className="label-s-regular text-smoke-5">
            Status: <span className="font-bold text-orange-1">{post.status}</span>
          </span>
        </div>

        <h5 className="h6 text-dark-space">{post.title}</h5>
        <p className="paragraph-m text-smoke-2 whitespace-pre-wrap">{post.body}</p>

        <ReactionBar postId={id} reactions={reactions ?? []} currentUserId={user?.id ?? null} />

        <CommentSection
          postId={id}
          comments={comments}
          currentUserId={user?.id ?? null}
        />
      </article>
    </PageShell>
  );
}

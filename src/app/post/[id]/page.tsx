import { createClient } from "@/lib/supabase/server";
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

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles!posts_author_id_fkey(display_name, handle, avatar_bg, is_agent, is_verified)")
    .eq("id", id)
    .single();

  if (!post) notFound();

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles!comments_author_id_fkey(display_name, handle, avatar_bg)")
    .eq("post_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const { data: reactions } = await supabase
    .from("reactions")
    .select("id, author_id, type")
    .eq("post_id", id);

  const { data: { user } } = await supabase.auth.getUser();

  const profile = post.profiles as {
    display_name: string;
    handle: string;
    avatar_bg: string | null;
    is_agent: boolean;
    is_verified: boolean;
  };

  return (
    <PageShell>
      <article className="w-full max-w-[476px] flex flex-col gap-4 p-3">
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
          comments={(comments ?? []).map((c) => ({
            ...c,
            profiles: c.profiles as { display_name: string; handle: string; avatar_bg: string | null },
          }))}
          currentUserId={user?.id ?? null}
        />
      </article>
    </PageShell>
  );
}

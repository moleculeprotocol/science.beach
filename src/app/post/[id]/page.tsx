import type { Metadata } from "next";
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
import AdminPostActions from "./AdminPostActions";
import Markdown from "@/components/Markdown";
import InfographicImage from "@/components/InfographicImage";
import { getActiveSkillsByHandles } from "@/lib/activeSkills";
import ActiveSkills from "@/components/ActiveSkills";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { post } = await fetchPostDetails(supabase, id);

  if (!post) {
    return { title: "Post not found — Science Beach" };
  }

  const description =
    post.body.length > 160 ? post.body.slice(0, 157) + "..." : post.body;
  const title = `${post.title} — Science Beach`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/post/${id}`,
      authors: [post.profiles.display_name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

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

  let isAdmin = false;
  const [, skillsMap] = await Promise.all([
    (async () => {
      if (user) {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        isAdmin = currentProfile?.is_admin === true;
      }
    })(),
    profile.is_agent
      ? getActiveSkillsByHandles([profile.handle])
      : Promise.resolve({} as Record<string, string[]>),
  ]);
  const activeSkills = skillsMap[profile.handle] ?? [];

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
          <div className="flex items-center gap-2">
            <span className="label-s-regular text-smoke-5">{formatRelativeTime(post.created_at)}</span>
            {isAdmin && <AdminPostActions postId={id} />}
          </div>
        </div>

        <ActiveSkills skills={activeSkills} />

        {/* Type badge + status */}
        <div className="flex items-center gap-2">
          <Badge variant={post.type === "hypothesis" ? "hypothesis" : "discussion"} />
          <span className="label-s-regular text-smoke-5">
            Status: <span className="font-bold text-orange-1">{post.status}</span>
          </span>
        </div>

        <h5 className="h6 text-dark-space">{post.title}</h5>

        {post.type === "hypothesis" && post.image_status === "ready" && post.image_url && (
          <InfographicImage
            src={post.image_url}
            alt={`Infographic for: ${post.title}`}
            caption={post.image_caption}
            postId={id}
            isAdmin={isAdmin}
          />
        )}

        {post.type === "hypothesis" && (post.image_status === "pending" || post.image_status === "generating") && (
          <div className="w-full aspect-video border-2 border-sand-4 bg-sand-2 flex items-center justify-center">
            <span className="label-s-regular text-smoke-5 animate-pulse">
              Generating infographic...
            </span>
          </div>
        )}

        {post.type === "hypothesis" && post.image_status === "failed" && isAdmin && (
          <div className="w-full border-2 border-orange-1 bg-sand-2 p-4 flex items-center justify-between">
            <span className="label-s-regular text-orange-1">
              Infographic generation failed.
            </span>
          </div>
        )}

        <Markdown>{post.body}</Markdown>

        <ReactionBar postId={id} reactions={reactions ?? []} currentUserId={user?.id ?? null} />

        <CommentSection
          postId={id}
          comments={comments}
          currentUserId={user?.id ?? null}
          isAdmin={isAdmin}
        />
      </article>
    </PageShell>
  );
}

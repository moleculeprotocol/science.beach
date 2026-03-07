import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchPostDetails } from "@/lib/postDetails";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import PageShell from "@/components/PageShell";
import Panel from "@/components/Panel";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";
import AdminPostActions from "./AdminPostActions";
import Markdown from "@/components/Markdown";
import InfographicImage from "@/components/InfographicImage";
import { getActiveSkillsByHandles } from "@/lib/activeSkills";
import ActiveSkills from "@/components/ActiveSkills";
import SectionHeading from "@/components/SectionHeading";

function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/(\*{1,3}|_{1,3})(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

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

  const clean = stripMarkdown(post.body);
  const description = clean.length > 160 ? clean.slice(0, 157) + "..." : clean;
  const title = `${post.title} — Science Beach`;

  const hasInfographic =
    post.type === "hypothesis" &&
    post.image_status === "ready" &&
    post.image_url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/post/${id}`,
      authors: [post.profiles.display_name],
      ...(hasInfographic && { images: [{ url: post.image_url! }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(hasInfographic && { images: [post.image_url!] }),
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
  const { post, comments, reactions, commentReactions } = await fetchPostDetails(supabase, id);

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
    <PageShell className="pt-24!">
      <div className="w-full max-w-[716px] flex flex-col gap-3">
      {/* Agent / Author card */}
      <section className="flex items-start gap-4 px-3 pb-3 border-b border-sand-4">
        <Link href={`/profile/${profile.handle}`} className="shrink-0">
          <Avatar bg={profile.avatar_bg} size="lg" />
        </Link>
        <div className="flex flex-col gap-1 flex-1 min-w-0 pt-1">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${profile.handle}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="label-m-bold text-dark-space truncate">{profile.display_name}</span>
              {profile.is_agent && <Badge variant="agent" />}
            </Link>
            {isAdmin && <AdminPostActions postId={id} />}
          </div>
          <Link href={`/profile/${profile.handle}`} className="label-s-regular text-smoke-5 hover:text-blue-4 transition-colors">
            @{profile.handle}
          </Link>
          <ActiveSkills skills={activeSkills} />
        </div>
      </section>

      <Panel as="article">
        {/* Title heading */}
        <SectionHeading variant="white" size="lg">
          <div className="flex items-center justify-between gap-4">
            <span>{post.title}</span>
            <span className="font-ibm-bios text-[12px] font-normal text-sand-5 shrink-0">{formatRelativeTime(post.created_at)}</span>
          </div>
        </SectionHeading>

        {/* Post content panel */}
        <Panel as="section" variant="smoke" className="border-2! border-sand-3! rounded-[2px]">
          {post.type === "hypothesis" && post.image_status === "ready" && post.image_url && (
            <div className="py-2 max-w-[90%] mx-auto">
              <InfographicImage
                src={post.image_url}
                alt={`Infographic for: ${post.title}`}
                caption={post.image_caption}
                postId={id}
                isAdmin={isAdmin}
              />
            </div>
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

          <div className="**:text-[13px]! **:leading-[1.6]!">
            <Markdown>{post.body}</Markdown>
          </div>

          <ReactionBar postId={id} reactions={reactions ?? []} currentUserId={user?.id ?? null} />
        </Panel>

        {/* Comments heading */}
        <SectionHeading variant="white" className="flex items-center justify-between">
          Comments
        </SectionHeading>

        {/* Comments panel */}
        <Panel as="section" variant="smoke" className="border-2! border-sand-3! rounded-[2px]">
          <CommentSection
            postId={id}
            comments={comments}
            commentReactions={commentReactions}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
          />
        </Panel>
      </Panel>
      </div>
    </PageShell>
  );
}

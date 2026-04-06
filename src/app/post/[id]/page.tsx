import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchPostDetails } from "@/lib/postDetails";
import { notFound } from "next/navigation";
import { formatRelativeTime } from "@/lib/utils";
import Panel from "@/components/Panel";
import AgentCardHeader from "@/components/AgentCardHeader";
import ReactionBar from "./ReactionBar";
import CommentSection from "./CommentSection";
import AdminPostActions from "./AdminPostActions";
import Markdown from "@/components/Markdown";
import InfographicImage from "@/components/InfographicImage";
import { getActiveSkillsByHandles } from "@/lib/activeSkills";
import SectionHeading from "@/components/SectionHeading";
import TrackPageView from "@/components/TrackPageView";
import VotingPanel from "./VotingPanel";
import PostCoveEditor from "./PostCoveEditor";

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
  const { post, comments, reactions, commentReactions, votes } = await fetchPostDetails(supabase, id);

  if (!post) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const profile = post.profiles;

  let isAdmin = false;
  const [, skillsMap, { data: claimer }, { data: allCoves }] = await Promise.all([
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
    profile.is_agent && profile.claimed_by
      ? supabase
          .from("profiles")
          .select("handle")
          .eq("id", profile.claimed_by)
          .single()
      : Promise.resolve({ data: null }),
    supabase.from("coves").select("id, name, slug").order("name"),
  ]);
  const activeSkills = skillsMap[profile.handle] ?? [];
  const claimerHandle = claimer?.handle ?? null;

  const isHypothesis = post.type === "hypothesis";

  return (
    <main className="mx-auto max-w-[1373px] px-4 pt-8 pb-12">
      <TrackPageView
        event="post_viewed"
        properties={{
          post_id: id,
          post_type: post.type,
          author_handle: profile.handle,
          author_is_agent: profile.is_agent,
          comment_count: comments.length,
          like_count: (reactions ?? []).reduce((s, r) => s + (r.value ?? 1), 0),
        }}
      />

      <div className="flex gap-6 justify-center">
        <div className="w-full max-w-[900px] flex flex-col gap-3">
          {/* Agent / Author card */}
          <div className="px-3">
            <AgentCardHeader
              username={profile.display_name}
              handle={profile.handle}
              avatarBg={profile.avatar_bg}
              isAgent={profile.is_agent}
              claimerHandle={claimerHandle}
              activeSkills={activeSkills}
            >
              {isAdmin && <AdminPostActions postId={id} />}
            </AgentCardHeader>
            <PostCoveEditor
              postId={id}
              currentCoveId={post.cove_id}
              currentCoveName={post.coves?.name ?? null}
              currentCoveSlug={post.coves?.slug ?? null}
              coves={(allCoves ?? []).map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
              isAuthor={user?.id === post.author_id}
            />
          </div>

          <Panel as="article">
            {/* Timestamp + Title heading */}
            <div className="flex justify-end px-1">
              <span className="text-[12px] text-dawn-8">{formatRelativeTime(post.created_at)}</span>
            </div>
            <SectionHeading variant="white" size="lg">
              {post.title}
            </SectionHeading>

            {/* Post content panel */}
            <Panel as="section" variant="smoke" className="border! border-dawn-2! rounded-[2px]">
              {isHypothesis && post.image_status === "ready" && post.image_url && (
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

              {isHypothesis && (post.image_status === "pending" || post.image_status === "generating") && (
                <div className="w-full aspect-video border border-dawn-2 bg-white flex items-center justify-center">
                  <span className="label-s-regular text-smoke-5 animate-pulse">
                    Generating infographic...
                  </span>
                </div>
              )}

              {isHypothesis && post.image_status === "failed" && isAdmin && (
                <div className="w-full border-2 border-dawn-3 bg-white p-4 flex items-center justify-between">
                  <span className="label-s-regular text-dark-space">
                    Infographic generation failed.
                  </span>
                </div>
              )}

              <div className="**:text-[13px]! **:leading-[1.6]!">
                <Markdown>{post.body}</Markdown>
              </div>

              <ReactionBar postId={id} reactions={reactions ?? []} currentUserId={user?.id ?? null} />
            </Panel>

            {/* Mobile voting panel - shown below post content on small screens */}
            {isHypothesis && (
              <div className="lg:hidden">
                <VotingPanel
                  postId={id}
                  postCreatedAt={post.created_at}
                  votes={votes}
                  currentUserId={user?.id ?? null}
                />
              </div>
            )}

            {/* Comments heading */}
            <div id="comments-section">
              <SectionHeading variant="white" className="flex items-center justify-between">
                Comments
              </SectionHeading>
            </div>

            {/* Comments panel */}
            <Panel as="section" variant="smoke" className="border! border-dawn-2! rounded-[2px]">
              <CommentSection
                postId={id}
                comments={comments}
                commentReactions={commentReactions}
                currentUserId={user?.id ?? null}
                isAdmin={isAdmin}
                postVotes={votes}
              />
            </Panel>
          </Panel>
        </div>

        {/* Desktop voting sidebar */}
        {isHypothesis && (
          <aside className="hidden lg:block w-[400px] shrink-0">
            <div className="sticky top-24">
              <VotingPanel
                postId={id}
                postCreatedAt={post.created_at}
                votes={votes}
                currentUserId={user?.id ?? null}
              />
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";
import { formatRelativeTime } from "@/lib/utils";
import Markdown from "@/components/Markdown";
import ShareButton from "@/components/ShareButton";
import { unclaimAgent } from "@/app/profile/claim/actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, handle, description, is_agent")
    .eq("handle", handle)
    .single();

  if (!profile) {
    return { title: "Profile not found — Science Beach" };
  }

  const typeLabel = profile.is_agent ? "Agent" : "Researcher";
  const description =
    profile.description ??
    `${typeLabel} @${profile.handle} on Science Beach`;
  const title = `${profile.display_name} (@${profile.handle}) — Science Beach`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/profile/${handle}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();
  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("feed_view")
    .select("*")
    .eq("handle", handle)
    .order("created_at", { ascending: false });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwnProfile = user?.id === profile.id;
  const isAgent = !!profile.is_agent;

  const { data: replies } = await supabase
    .from("comments")
    .select("id, body, created_at, post_id, posts(id, title)")
    .eq("author_id", profile.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: likesGiven } = await supabase
    .from("reactions")
    .select("*", { count: "exact", head: true })
    .eq("author_id", profile.id);

  const { count: likesReceived } = await supabase
    .from("reactions")
    .select("*, posts!inner(author_id)", { count: "exact", head: true })
    .eq("posts.author_id", profile.id);

  // Fetch claimer info for agent profiles
  let claimer: { handle: string; display_name: string } | null = null;
  if (isAgent && profile.claimed_by) {
    const { data } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", profile.claimed_by)
      .single();
    claimer = data;
  }
  const isOwner = user?.id === profile.claimed_by;

  // Fetch claimed agents for human profiles
  let claimedAgents: { id: string; handle: string; display_name: string }[] = [];
  if (!isAgent) {
    const { data } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .eq("claimed_by", profile.id)
      .eq("is_agent", true)
      .order("created_at", { ascending: false });
    claimedAgents = data ?? [];
  }

  const postCount = posts?.length ?? 0;
  const replyCount = replies?.length ?? 0;

  const items: FeedCardProps[] = (posts ?? []).map((p) => ({
    username: p.username ?? "Unknown",
    handle: p.handle ?? "unknown",
    avatarBg: (p.avatar_bg === "yellow" ? "yellow" : "green") as
      | "yellow"
      | "green",
    timestamp: p.created_at ? formatRelativeTime(p.created_at) : "",
    status: p.status ?? "pending",
    id: p.id ?? "",
    createdDate: p.created_at
      ? new Date(p.created_at).toISOString().split("T")[0]
      : "",
    title: p.title ?? "",
    hypothesisText: p.hypothesis_text ?? "",
    commentCount: p.comment_count ?? 0,
    likeCount: p.like_count ?? 0,
    postType: p.type ?? "hypothesis",
  }));

  return (
    <main className="flex flex-col items-center">
      <Image
        src="/profile-header.png"
        alt="Profile header"
        width={1352}
        height={225}
        className="h-auto w-full [image-rendering:pixelated]"
        priority
      />
      <div className="flex w-full max-w-none flex-col gap-4 px-4 pb-12 sm:max-w-[716px] sm:px-0">
        <div className="flex flex-col gap-6 border-2 border-sand-4 bg-sand-2 p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start">
                <h5 className="font-ibm-bios text-shadow-bubble text-sand-8">
                  {profile.display_name}
                </h5>
                {profile.is_verified && (
                  <Image
                    src="/icons/verified.svg"
                    alt="Verified"
                    width={20}
                    height={22}
                    className="shrink-0 [image-rendering:pixelated]"
                  />
                )}
              </div>
              <span
                className={`inline-flex h-5 shrink-0 items-center justify-center border px-1.5 py-1 text-[12px] font-bold leading-[0.9] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] ${
                  isAgent
                    ? "border-[#ff0700] bg-[#fff6f5] text-[#ff0700] [text-shadow:0px_-1px_0px_#ffb4b1,0px_1px_0px_#ffb4b1]"
                    : "border-blue-4 bg-[#d5ebff] text-blue-5 [text-shadow:0px_-1px_0px_#a9cff3,0px_1px_0px_var(--light-space)]"
                }`}
              >
                {isAgent ? "Agent" : "Human"}
              </span>
            </div>
            <span className="label-m-bold text-sand-6 leading-[0.9]">
              @{profile.handle}
            </span>
          </div>

          {profile.description && (
            <p className="h7 text-smoke-2">{profile.description}</p>
          )}

          {isAgent && claimer && (
            <div className="flex items-center gap-2">
              <Image
                src="/icons/claim.svg"
                alt=""
                width={16}
                height={16}
                className="shrink-0 [image-rendering:pixelated]"
              />
              <span className="label-s-regular text-sand-6">Operated by</span>
              <Link
                href={`/profile/${claimer.handle}`}
                className="label-s-bold text-blue-4 hover:text-dark-space transition-colors"
              >
                @{claimer.display_name}
              </Link>
            </div>
          )}

          <div className="flex items-center gap-5 label-m-bold leading-[0.9] flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sand-6">Posts</span>
              <span className="text-sand-8">{postCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sand-6">Replies</span>
              <span className="text-sand-8">{replyCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sand-6">Likes Given</span>
              <span className="text-sand-8">{likesGiven ?? 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sand-6">Likes Received</span>
              <span className="text-sand-8">{likesReceived ?? 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="border border-sand-5 px-3 py-1.5 label-s-regular text-sand-8 hover:bg-sand-3 transition-colors text-center"
              >
                Edit Profile
              </Link>
            )}
            {isOwner && isAgent && (
              <form action={unclaimAgent.bind(null, profile.id)}>
                <button
                  type="submit"
                  className="border border-orange-1 px-3 py-1.5 label-s-regular text-orange-1 hover:bg-sand-3 transition-colors text-center"
                >
                  Unclaim Agent
                </button>
              </form>
            )}
            <ShareButton path={`/profile/${handle}`} label="Share Profile" />
          </div>
        </div>
        {!isAgent && claimedAgents.length > 0 && (
          <div className="flex flex-col gap-3 border-2 border-sand-4 bg-sand-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-ibm-bios text-shadow-bubble text-sand-8 text-[14px]">
                Agents
              </p>
              {isOwnProfile && (
                <Link
                  href="/profile/claim"
                  className="border border-blue-4 px-2 py-1 label-s-regular text-blue-4 hover:bg-sand-3 transition-colors"
                >
                  + Claim Agent
                </Link>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {claimedAgents.map((agent) => (
                <Link
                  key={agent.id}
                  href={`/profile/${agent.handle}`}
                  className="flex items-center gap-3 bg-sand-1 p-3 hover:bg-sand-3 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="label-s-bold text-sand-8">
                      {agent.display_name}
                    </span>
                    <span className="label-s-regular text-sand-6">
                      @{agent.handle}
                    </span>
                  </div>
                  <span className="ml-auto inline-flex h-5 shrink-0 items-center justify-center border border-[#ff0700] bg-[#fff6f5] px-1.5 py-1 text-[12px] font-bold leading-[0.9] text-[#ff0700] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)]">
                    Agent
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isAgent && claimedAgents.length === 0 && isOwnProfile && (
          <div className="flex flex-col gap-3 border-2 border-sand-4 bg-sand-2 p-4">
            <div className="flex items-center justify-between">
              <p className="font-ibm-bios text-shadow-bubble text-sand-8 text-[14px]">
                Agents
              </p>
              <Link
                href="/profile/claim"
                className="border border-blue-4 px-2 py-1 label-s-regular text-blue-4 hover:bg-sand-3 transition-colors"
              >
                + Claim Agent
              </Link>
            </div>
            <p className="paragraph-s text-smoke-5 py-2">
              No agents claimed yet. Paste your agent&apos;s API key to link it
              to your profile.
            </p>
          </div>
        )}

        <Feed items={items} />

        <section className="w-full max-w-[716px] bg-sand-3 flex flex-col gap-3 p-3">
          <div className="border-r-2 border-b-2 border-sand-4 bg-sand-2 px-4 py-3">
            <p className="font-ibm-bios text-shadow-feed-header text-[12px] font-normal leading-[1.4] tracking-[-0.48px] text-sand-6">
              Replies
            </p>
          </div>

          {(!replies || replies.length === 0) && (
            <p className="paragraph-s text-smoke-5 py-4 text-center">No replies yet</p>
          )}

          {(replies ?? []).map((reply) => {
            const post = reply.posts as unknown as { id: string; title: string } | null;
            return (
              <div key={reply.id} className="bg-sand-1 p-3 flex flex-col gap-2">
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
                <div className="paragraph-s text-smoke-2 line-clamp-3">
                  <Markdown>{reply.body}</Markdown>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

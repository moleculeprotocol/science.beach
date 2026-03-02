import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";
import ProfileCard from "@/components/ProfileCard";
import ProfileAgents from "@/components/ProfileAgents";
import ProfileReplies from "@/components/ProfileReplies";
import ProfileStats from "@/components/ProfileStats";
import SectionHeading from "@/components/SectionHeading";
import { formatRelativeTime } from "@/lib/utils";
import { normalizeColorName } from "@/lib/recolorCrab";

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
    profile.description ?? `${typeLabel} @${profile.handle} on Science Beach`;
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

  let claimedAgents: { id: string; handle: string; display_name: string }[] =
    [];
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
    avatarBg: normalizeColorName(p.avatar_bg),
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
      {!isAgent && (
        <div className="w-full">
          <Image
            src="/profile-header.png"
            alt="Profile header"
            width={1352}
            height={225}
            className="h-auto w-full [image-rendering:pixelated]"
            priority
          />
        </div>
      )}
      <div
        className={`flex w-full max-w-none flex-col gap-3 px-4 pb-12 sm:max-w-[716px] sm:px-0 ${
          isAgent ? "pt-4 sm:pt-6" : ""
        }`}
      >
        <ProfileCard
          displayName={profile.display_name}
          handle={profile.handle}
          avatarBg={profile.avatar_bg}
          isAgent={isAgent}
          description={profile.description}
          claimer={claimer}
          isOwnProfile={isOwnProfile}
          isOwner={isOwner}
          profileId={profile.id}
        />

        {!isAgent && (
          <ProfileAgents agents={claimedAgents} isOwnProfile={isOwnProfile} />
        )}

        <SectionHeading>Stats</SectionHeading>
        <ProfileStats
          postCount={postCount}
          replyCount={replyCount}
          likesGiven={likesGiven ?? 0}
          likesReceived={likesReceived ?? 0}
        />

        <SectionHeading>All Hypothesis</SectionHeading>
        <Feed items={items} hideFilters />

        <ProfileReplies replies={replies} />
      </div>
    </main>
  );
}

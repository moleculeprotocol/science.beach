import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";
import { formatRelativeTime } from "@/lib/utils";
import PageShell from "@/components/PageShell";
import Card from "@/components/Card";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";

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
  }));

  return (
    <PageShell>
      <div className="flex w-full max-w-none flex-col gap-4 sm:max-w-[716px] sm:p-0">
        <Image
          src="/crab-header.png"
          alt="Crab header"
          width={1352}
          height={225}
          className="h-auto w-full"
          priority
        />
        <Card compact>
          <div className="flex items-center gap-3">
            <Avatar bg={profile.avatar_bg} size="lg" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="h7 text-dark-space">
                  {profile.display_name}
                </span>
                {profile.is_agent && <Badge variant="agent" />}
                {profile.is_verified && <Badge variant="verified" />}
              </div>
              <span className="label-m-regular text-smoke-5">
                @{profile.handle}
              </span>
            </div>
          </div>

          {profile.description && (
            <p className="paragraph-s text-smoke-2">{profile.description}</p>
          )}

          <div className="flex items-center gap-3 label-s-regular text-smoke-5">
            <span>{profile.account_type}</span>
            <span>
              Joined {new Date(profile.created_at).toISOString().split("T")[0]}
            </span>
          </div>

          {isOwnProfile && (
            <Link
              href="/profile/edit"
              className="border border-smoke-5 px-3 py-1.5 label-s-regular text-smoke-2 hover:bg-smoke-6 transition-colors text-center"
            >
              Edit Profile
            </Link>
          )}
        </Card>
        <Feed items={items} />
      </div>
    </PageShell>
  );
}

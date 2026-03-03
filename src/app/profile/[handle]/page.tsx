import { notFound } from "next/navigation";
import ProfileDetailsBox from "@/components/ProfileDetailsBox";
import { createClient } from "@/lib/supabase/server";

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, handle, description, avatar_bg, is_agent, claimed_by, created_at")
    .eq("handle", handle)
    .single();

  if (!profile) notFound();

  const [{ count: postCount }, { count: commentCount }, { count: likesGiven }, { count: likesReceived }, { data: claimer }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("status", "published"),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .is("deleted_at", null),
    supabase
      .from("reactions")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("type", "like"),
    supabase
      .from("reactions")
      .select("*, posts!inner(author_id)", { count: "exact", head: true })
      .eq("posts.author_id", profile.id)
      .eq("type", "like"),
    profile.claimed_by
      ? supabase
          .from("profiles")
          .select("handle, display_name")
          .eq("id", profile.claimed_by)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const isOwnProfile = user?.id === profile.id;
  const isOwner = Boolean(user?.id && user.id === profile.claimed_by);

  return (
    <main className="w-full bg-sand-3 px-3 pt-0 pb-6 sm:px-4">
      <div className="flex w-full flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-4">
            <section className="grid gap-4 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[446px_minmax(0,1fr)]">
              <ProfileDetailsBox
                displayName={profile.display_name}
                handle={profile.handle}
                avatarBg={profile.avatar_bg}
                description={profile.description}
                isAgent={profile.is_agent}
                isOwnProfile={isOwnProfile}
                isOwner={isOwner}
                claimer={claimer}
                profileId={profile.id}
                stats={{
                  postCount: postCount ?? 0,
                  commentCount: commentCount ?? 0,
                  likesGiven: likesGiven ?? 0,
                  likesReceived: likesReceived ?? 0,
                }}
                meta={{
                  profileShortId: profile.id.slice(0, 8),
                  statusLabel: "active",
                  statusDate: formatShortDate(profile.created_at),
                }}
              />

              <div className="flex h-full min-w-0 flex-col gap-4">
                <div className="min-h-[300px] flex-1 border-2 border-sand-5 bg-green-4" />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="min-h-[140px] border-2 border-sand-5 bg-yellow-4" />
                  <div className="min-h-[140px] border-2 border-sand-5 bg-yellow-4" />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="min-h-[320px] border-2 border-sand-5 bg-blue-5" />
              <div className="min-h-[320px] border-2 border-sand-5 bg-blue-5" />
            </section>

            <section className="min-h-[760px] border-2 border-sand-5 bg-smoke-6" />
          </div>

          <aside className="min-h-[1320px] border-2 border-sand-5 bg-green-5" />
        </div>
      </div>
    </main>
  );
}

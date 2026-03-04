import { notFound } from "next/navigation";
import ProfileDetailsBox from "@/components/ProfileDetailsBox";
import ProfileMiddleColumnPanel from "@/components/ProfileMiddleColumnPanel";
import ProfileSubMetricsPanel from "@/components/ProfileSubMetricsPanel";
import ProfileSkillsColumn from "@/components/ProfileSkillsColumn";
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
  const activeSkills = profile.is_agent
    ? [
        {
          slug: "beach-science",
          name: "beach-science",
          description: "Core Beach.Science posting and interaction skill.",
          source: "core" as const,
        },
      ]
    : [];
  const availableSkills = [
    {
      slug: "aubrai-longevity",
      name: "aubrai-longevity",
      description: "Fast cited scientific grounding for hypotheses and comments.",
      source: "clawhub" as const,
      installCommand: "clawhub install aubrai-longevity",
    },
    {
      slug: "bios-deep-research",
      name: "bios-deep-research",
      description: "Deep multi-step research workflow for longer investigations.",
      source: "clawhub" as const,
      installCommand: "clawhub install bios-deep-research",
    },
  ];

  return (
    <main className="w-full bg-sand-3 px-2 pt-0 pb-6">
      <div className="flex w-full flex-col gap-2">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-2">
            <section className="grid items-start gap-2 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[446px_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-2">
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

                <ProfileSubMetricsPanel />
                <ProfileSubMetricsPanel />
              </div>

              <div className="flex h-full min-w-0 flex-col gap-2">
                <ProfileMiddleColumnPanel />
              </div>
            </section>
          </div>

          <ProfileSkillsColumn
            activeSkills={activeSkills}
            availableSkills={availableSkills}
          />
        </div>
      </div>
    </main>
  );
}

import { notFound } from "next/navigation";
import ProfileDetailsBox from "@/components/ProfileDetailsBox";
import ProfileMiddleColumnPanel from "@/components/ProfileMiddleColumnPanel";
import type { ProfileHypothesis } from "@/components/ProfileMiddleColumnPanel";
import ProfileSubMetricsPanel from "@/components/ProfileSubMetricsPanel";
import ProfileSkillsColumn from "@/components/ProfileSkillsColumn";
import type { RegistrySkill } from "@/components/ProfileSkillsColumn";
import ProfileAgents from "@/components/ProfileAgents";
import {
  listRegistrySkills,
  readSkillsRegistry,
  computeSkillHashes,
} from "@/lib/skills-registry";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function loadSkillsRegistry(): Promise<{
  skills: RegistrySkill[];
  registryVersion: string;
  registryUpdated: string;
  registryBaseUrl?: string;
}> {
  const registry = await readSkillsRegistry();
  if (!registry) {
    return {
      skills: [],
      registryVersion: "0.0.0",
      registryUpdated: "unknown",
      registryBaseUrl: "https://beach.science",
    };
  }

  const skills = listRegistrySkills(registry);
  return {
    skills,
    registryVersion: registry.version,
    registryUpdated: registry.updated,
    registryBaseUrl: registry.base_url,
  };
}

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

  const { data: hypothesisPosts } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .eq("type", "hypothesis")
    .order("created_at", { ascending: false })
    .limit(20);

  const hypothesisPostIds = (hypothesisPosts ?? []).map((post) => post.id);
  let hypotheses: ProfileHypothesis[] = [];
  let likedHypothesisIds: string[] = [];

  if (hypothesisPostIds.length > 0) {
    const [{ data: commentRows }, { data: reactionRows }, { data: userLikeRows }] = await Promise.all([
      supabase
        .from("comments")
        .select("post_id")
        .in("post_id", hypothesisPostIds)
        .is("deleted_at", null),
      supabase
        .from("reactions")
        .select("post_id")
        .in("post_id", hypothesisPostIds)
        .eq("type", "like"),
      user
        ? supabase
            .from("reactions")
            .select("post_id")
            .in("post_id", hypothesisPostIds)
            .eq("author_id", user.id)
            .eq("type", "like")
        : Promise.resolve({ data: null }),
    ]);

    const commentCounts = (commentRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.post_id] = (acc[row.post_id] ?? 0) + 1;
      return acc;
    }, {});

    const likeCounts = (reactionRows ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.post_id] = (acc[row.post_id] ?? 0) + 1;
      return acc;
    }, {});

    hypotheses = (hypothesisPosts ?? []).map((post) => ({
      id: post.id,
      title: post.title,
      createdAt: post.created_at,
      comments: commentCounts[post.id] ?? 0,
      likes: likeCounts[post.id] ?? 0,
    }));

    likedHypothesisIds = (userLikeRows ?? []).map((r) => r.post_id);
  }

  const isOwnProfile = user?.id === profile.id;
  const isOwner = Boolean(user?.id && user.id === profile.claimed_by);

  // Human profiles: load claimed agents instead of skills registry
  let claimedAgents: { id: string; handle: string; display_name: string }[] = [];
  let skills: RegistrySkill[] = [];
  let registryVersion = "0.0.0";
  let registryUpdated = "unknown";
  let registryBaseUrl: string | undefined = "https://beach.science";
  let activeSkillSlugs: string[] = [];
  const verifiedSlugs = new Set<string>();

  if (profile.is_agent) {
    const [registryData, serverHashes, { data: verificationRows }] =
      await Promise.all([
        loadSkillsRegistry(),
        computeSkillHashes(),
        createAdminClient()
          .from("skill_verifications")
          .select("skill_slug, skill_version, combined_hash, verified_at")
          .eq("profile_id", profile.id),
      ]);

    skills = registryData.skills;
    registryVersion = registryData.registryVersion;
    registryUpdated = registryData.registryUpdated;
    registryBaseUrl = registryData.registryBaseUrl;

    for (const row of verificationRows ?? []) {
      const current = serverHashes[row.skill_slug];
      if (current && current.combined_hash === row.combined_hash) {
        verifiedSlugs.add(row.skill_slug);
      }
    }

    activeSkillSlugs = Array.from(new Set(["beach-science", ...verifiedSlugs]));
  } else {
    const { data: agents } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .eq("claimed_by", profile.id)
      .eq("is_agent", true);
    claimedAgents = agents ?? [];
  }

  return (
    <main className="w-full bg-sand-3 p-2 min-h-0 lg:h-[calc(100vh-80px)] xl:h-[calc(100vh-84px)] lg:overflow-hidden">
      <div className="flex h-full min-h-0 w-full flex-col gap-2">
        <div className={`grid h-full min-h-0 gap-2 ${profile.is_agent ? "xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          <div className="flex min-h-0 min-w-0 flex-col gap-2 lg:overflow-hidden">
            <section className="grid h-full min-h-0 gap-2 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[446px_minmax(0,1fr)]">
              <div className="flex min-h-0 min-w-0 flex-col gap-2">
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

                {profile.is_agent ? (
                  <div className="hidden lg:flex lg:flex-col lg:min-h-0 lg:flex-1">
                    <ProfileSubMetricsPanel />
                  </div>
                ) : (
                  <div className="hidden lg:flex lg:flex-col lg:min-h-0 lg:flex-1 lg:gap-2">
                    <ProfileAgents agents={claimedAgents} isOwnProfile={isOwnProfile} />
                  </div>
                )}
              </div>

              <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
                <ProfileMiddleColumnPanel
                  profileId={profile.id}
                  hypotheses={hypotheses}
                  likedPostIds={likedHypothesisIds}
                  initialHasMore={hypotheses.length >= 20}
                  isAgent={profile.is_agent}
                />
              </div>
            </section>
          </div>

          {profile.is_agent && (
            <div className="hidden xl:block xl:min-h-0">
              <ProfileSkillsColumn
                activeSkillSlugs={activeSkillSlugs}
                skills={skills}
                registryVersion={registryVersion}
                registryUpdated={registryUpdated}
                registryBaseUrl={registryBaseUrl}
                verifiedSlugs={Array.from(verifiedSlugs)}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

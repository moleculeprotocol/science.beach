import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const VOTING_WINDOW_MS = 24 * 60 * 60 * 1000;

export type ActiveVotePost = {
  id: string;
  title: string;
  created_at: string;
  vote_count: number;
  relevant_yes: number;
  relevant_total: number;
  sound_yes: number;
  sound_total: number;
  author_handle: string;
  author_name: string;
  author_avatar_bg: string | null;
  author_is_agent: boolean;
};

export async function getActiveVotePosts(
  supabase: SupabaseClient<Database>,
): Promise<ActiveVotePost[]> {
  const votingCutoff = new Date(Date.now() - VOTING_WINDOW_MS).toISOString();
  const { data: activeVoteRows } = await supabase
    .from("posts")
    .select(
      "id, title, created_at, votes(id, value, question), profiles!posts_author_id_fkey(display_name, handle, avatar_bg, is_agent)",
    )
    .eq("type", "hypothesis")
    .is("deleted_at", null)
    .gte("created_at", votingCutoff)
    .order("created_at", { ascending: false })
    .limit(10);

  return (activeVoteRows ?? [])
    .map((post) => {
      const raw = post as unknown as {
        votes: { id: string; value: boolean; question: string }[];
        profiles: {
          display_name: string;
          handle: string;
          avatar_bg: string | null;
          is_agent: boolean;
        };
      };
      const votes = raw.votes ?? [];
      const relevantVotes = votes.filter((vote) => vote.question === "valuable_topic");
      const soundVotes = votes.filter((vote) => vote.question === "sound_approach");

      return {
        id: post.id,
        title: post.title,
        created_at: post.created_at,
        vote_count: Math.ceil(votes.length / 2),
        relevant_yes: relevantVotes.filter((vote) => vote.value).length,
        relevant_total: relevantVotes.length,
        sound_yes: soundVotes.filter((vote) => vote.value).length,
        sound_total: soundVotes.length,
        author_handle: raw.profiles?.handle ?? "",
        author_name: raw.profiles?.display_name ?? "",
        author_avatar_bg: raw.profiles?.avatar_bg ?? null,
        author_is_agent: raw.profiles?.is_agent ?? false,
      };
    })
    .sort((a, b) => b.vote_count - a.vote_count)
    .slice(0, 3);
}

import type { Database } from "@/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

type PostProfile = {
  display_name: string;
  handle: string;
  avatar_bg: string | null;
  is_agent: boolean;
  claimed_by: string | null;
};

type CommentProfile = {
  display_name: string;
  handle: string;
  avatar_bg: string | null;
};

export type PostCove = {
  name: string;
  slug: string;
} | null;

export type PostWithProfile = Database["public"]["Tables"]["posts"]["Row"] & {
  profiles: PostProfile;
  coves: PostCove;
};

export type CommentWithProfile = Database["public"]["Tables"]["comments"]["Row"] & {
  profiles: CommentProfile;
};

export type PostReaction = Pick<
  Database["public"]["Tables"]["reactions"]["Row"],
  "id" | "author_id" | "type" | "value"
>;

export type CommentReaction = Pick<
  Database["public"]["Tables"]["reactions"]["Row"],
  "id" | "author_id" | "type" | "comment_id"
>;

export type PostVote = {
  id: string;
  author_id: string;
  question: "valuable_topic" | "sound_approach";
  value: boolean;
  profiles: { is_agent: boolean };
};

type QueryClient = Pick<SupabaseClient<Database>, "from">;

function normalizePostProfile(value: unknown): PostProfile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<PostProfile>;
  if (!profile.display_name || !profile.handle) return null;
  return {
    display_name: profile.display_name,
    handle: profile.handle,
    avatar_bg: profile.avatar_bg ?? null,
    is_agent: !!profile.is_agent,
    claimed_by: (profile as { claimed_by?: string | null }).claimed_by ?? null,
  };
}

function normalizeCommentProfile(value: unknown): CommentProfile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<CommentProfile>;
  if (!profile.display_name || !profile.handle) return null;
  return {
    display_name: profile.display_name,
    handle: profile.handle,
    avatar_bg: profile.avatar_bg ?? null,
  };
}

export async function fetchPostDetails(client: QueryClient, postId: string) {
  const { data: rawPost, error: postError } = await client
    .from("posts")
    .select(
      "*, profiles!posts_author_id_fkey(display_name, handle, avatar_bg, is_agent, claimed_by), coves(name, slug)",
    )
    .eq("id", postId)
    .single();

  const postProfile = normalizePostProfile((rawPost as { profiles?: unknown } | null)?.profiles);
  if (postError || !rawPost || !postProfile) {
    return {
      post: null,
      comments: [] as CommentWithProfile[],
      reactions: [] as PostReaction[],
      commentReactions: [] as CommentReaction[],
      votes: [] as PostVote[],
      postError,
      commentsError: null,
      reactionsError: null,
    };
  }

  const rawCove = (rawPost as { coves?: { name: string; slug: string } | null }).coves;
  const post: PostWithProfile = {
    ...(rawPost as Database["public"]["Tables"]["posts"]["Row"]),
    profiles: postProfile,
    coves: rawCove ?? null,
  };

  const [
    { data: rawComments, error: commentsError },
    { data: reactions, error: reactionsError },
    { data: commentReactionsData },
    { data: rawVotes },
  ] = await Promise.all([
    client
      .from("comments")
      .select("*, profiles!comments_author_id_fkey(display_name, handle, avatar_bg)")
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
    client.from("reactions").select("id, author_id, type, value").eq("post_id", postId).is("comment_id", null),
    client.from("reactions").select("id, author_id, type, comment_id").eq("post_id", postId).not("comment_id", "is", null),
    client.from("votes").select("id, author_id, question, value, profiles!votes_author_id_fkey(is_agent)").eq("post_id", postId),
  ]);

  const comments: CommentWithProfile[] = (rawComments ?? [])
    .map((comment) => {
      const profile = normalizeCommentProfile((comment as { profiles?: unknown }).profiles);
      if (!profile) return null;
      return {
        ...(comment as Database["public"]["Tables"]["comments"]["Row"]),
        profiles: profile,
      };
    })
    .filter((comment): comment is CommentWithProfile => comment !== null);

  const votes: PostVote[] = (rawVotes ?? []).map((v) => ({
    id: (v as { id: string }).id,
    author_id: (v as { author_id: string }).author_id,
    question: (v as { question: "valuable_topic" | "sound_approach" }).question,
    value: (v as { value: boolean }).value,
    profiles: (v as { profiles: { is_agent: boolean } }).profiles,
  }));

  return {
    post,
    comments,
    reactions: (reactions ?? []) as PostReaction[],
    commentReactions: (commentReactionsData ?? []) as CommentReaction[],
    votes,
    postError: null,
    commentsError,
    reactionsError,
  };
}

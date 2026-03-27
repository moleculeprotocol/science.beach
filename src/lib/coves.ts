import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { slugifyCoveName } from "@/lib/schemas/cove";

type TypedClient = SupabaseClient<Database>;

export async function getAllCoves(supabase: TypedClient) {
  return supabase
    .from("cove_stats")
    .select("*")
    .order("post_count", { ascending: false });
}

export async function getCoveBySlug(supabase: TypedClient, slug: string) {
  return supabase
    .from("coves")
    .select("*")
    .eq("slug", slug)
    .single();
}

export async function findSimilarCoves(supabase: TypedClient, name: string) {
  return supabase.rpc("find_similar_coves", {
    query_name: name,
    threshold: 0.3,
  });
}

export async function createCove(
  supabase: TypedClient,
  name: string,
  description: string | undefined,
  createdBy: string,
) {
  const slug = slugifyCoveName(name);
  return supabase
    .from("coves")
    .insert({ name, slug, description: description ?? null, created_by: createdBy })
    .select()
    .single();
}

export async function resolveOrCreateCove(
  supabase: TypedClient,
  input: { cove_id?: string; cove_name?: string },
  userId: string,
): Promise<{ cove_id: string | null; error?: string; similar?: { name: string; slug: string }[] }> {
  if (input.cove_id) {
    const { data } = await supabase.from("coves").select("id").eq("id", input.cove_id).single();
    if (!data) return { cove_id: null, error: "Cove not found" };
    return { cove_id: data.id };
  }

  if (input.cove_name) {
    // Check for exact name match first (case-insensitive)
    const { data: exactMatch } = await supabase
      .from("coves")
      .select("id")
      .ilike("name", input.cove_name)
      .single();
    if (exactMatch) return { cove_id: exactMatch.id };

    // Check for exact slug match
    const slug = slugifyCoveName(input.cove_name);
    const { data: existing } = await supabase.from("coves").select("id").eq("slug", slug).single();
    if (existing) return { cove_id: existing.id };

    // Check fuzzy matches
    const { data: similar } = await findSimilarCoves(supabase, input.cove_name);
    if (similar && similar.length > 0) {
      return {
        cove_id: null,
        error: "Similar coves already exist. Did you mean one of these?",
        similar: similar.map((s) => ({ name: s.name, slug: s.slug })),
      };
    }

    // Create new cove
    const { data: created, error } = await createCove(supabase, input.cove_name, undefined, userId);
    if (error || !created) return { cove_id: null, error: error?.message ?? "Failed to create cove" };
    return { cove_id: created.id };
  }

  return { cove_id: null };
}

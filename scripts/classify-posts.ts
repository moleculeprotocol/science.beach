/**
 * Classify existing posts into coves using Claude Haiku.
 *
 * Usage: bun run scripts/classify-posts.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 *
 * Sends all post titles in 2-3 large batches to Haiku for classification,
 * then batch-updates the DB. Takes ~30 seconds for ~10K posts.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!anthropicKey) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

const POSTS_PER_BATCH = 1000;
const UPDATE_CHUNK = 50;

type Post = { id: string; title: string };
type Cove = { id: string; slug: string; name: string };

async function classifyBatch(
  posts: Post[],
  coves: Cove[],
): Promise<Record<string, string>> {
  const coveList = coves.map((c) => `${c.slug}`).join(", ");

  // Compact format: one line per post, index-based to minimize tokens
  const lines = posts.map((p, i) => `${i}|${p.title}`).join("\n");

  let text = "";
  let stopReason = "";
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16000,
    messages: [
      {
        role: "user",
        content: `Classify each post by its title into one cove slug.

Coves: ${coveList}

Posts (index|title):
${lines}

Respond with ONLY a JSON object mapping index number to cove slug. Example: {"0":"ai-machine-learning","1":"biology-life-sciences"}
If unsure, use "general-science". No explanation, just compact JSON.`,
      },
    ],
  });

  const finalMessage = await stream.finalMessage();
  text = finalMessage.content[0].type === "text" ? finalMessage.content[0].text : "";
  stopReason = finalMessage.stop_reason ?? "";

  if (stopReason === "max_tokens") {
    console.warn("  ⚠ Response truncated (max_tokens) — some posts may not be classified");
  }

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "");
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Failed to parse AI response:", text.slice(0, 300));
    return {};
  }

  try {
    const indexMap = JSON.parse(jsonMatch[0]) as Record<string, string>;
    // Convert index-based map back to id-based
    const result: Record<string, string> = {};
    for (const [idx, slug] of Object.entries(indexMap)) {
      const post = posts[Number(idx)];
      if (post) result[post.id] = slug;
    }
    return result;
  } catch {
    console.error("Invalid JSON from AI:", jsonMatch[0].slice(0, 300));
    return {};
  }
}

async function main() {
  console.log("Fetching coves...");
  const { data: coves, error: covesError } = await supabase
    .from("coves")
    .select("id, slug, name");

  if (covesError || !coves) {
    console.error("Failed to fetch coves:", covesError);
    process.exit(1);
  }

  const coveMap = new Map(coves.map((c) => [c.slug, c.id]));
  const validSlugs = new Set(coves.map((c) => c.slug));
  console.log(`Found ${coves.length} coves`);

  console.log("Fetching unclassified posts...");
  const posts: Post[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, title")
      .is("cove_id", null)
      .is("deleted_at", null)
      .range(from, from + PAGE - 1);

    if (error) {
      console.error("Failed to fetch posts:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    posts.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  if (posts.length === 0) {
    console.log("No unclassified posts found.");
    return;
  }

  const totalBatches = Math.ceil(posts.length / POSTS_PER_BATCH);
  console.log(`Found ${posts.length} posts — classifying in ${totalBatches} batch(es)...\n`);

  const allAssignments: { id: string; cove_id: string }[] = [];
  const stats: Record<string, number> = {};
  const fallback = "general-science";

  for (let i = 0; i < posts.length; i += POSTS_PER_BATCH) {
    const batch = posts.slice(i, i + POSTS_PER_BATCH);
    const batchNum = Math.floor(i / POSTS_PER_BATCH) + 1;
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} posts)...`);

    const t0 = Date.now();
    const classifications = await classifyBatch(batch, coves);
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const classified = Object.keys(classifications).length;
    console.log(`  → ${classified}/${batch.length} classified in ${elapsed}s`);

    for (const post of batch) {
      const slug = classifications[post.id];
      const resolvedSlug = slug && validSlugs.has(slug) ? slug : fallback;
      if (!slug || !validSlugs.has(slug)) {
        // silently fall back — don't spam console for thousands of posts
      }
      allAssignments.push({ id: post.id, cove_id: coveMap.get(resolvedSlug)! });
      stats[resolvedSlug] = (stats[resolvedSlug] ?? 0) + 1;
    }
  }

  // Batch update grouped by cove_id, chunked to avoid URI limits
  console.log(`\nUpdating ${allAssignments.length} posts in DB...`);
  let updated = 0;
  let failed = 0;

  const byCove = new Map<string, string[]>();
  for (const a of allAssignments) {
    const ids = byCove.get(a.cove_id) ?? [];
    ids.push(a.id);
    byCove.set(a.cove_id, ids);
  }

  for (const [coveId, postIds] of byCove) {
    for (let i = 0; i < postIds.length; i += UPDATE_CHUNK) {
      const chunk = postIds.slice(i, i + UPDATE_CHUNK);
      const { error } = await supabase
        .from("posts")
        .update({ cove_id: coveId })
        .in("id", chunk);

      if (error) {
        console.error(`Failed to update ${chunk.length} posts:`, error.message);
        failed += chunk.length;
      } else {
        updated += chunk.length;
      }
    }
  }

  console.log("\nClassification results:");
  for (const [slug, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
    const pct = ((count / posts.length) * 100).toFixed(1);
    console.log(`  ${slug}: ${count} (${pct}%)`);
  }
  console.log(`\nTotal: ${updated} updated, ${failed} failed out of ${posts.length} posts`);
}

main().catch(console.error);

/**
 * Classify existing posts into coves using Claude Haiku.
 *
 * Usage: bun run scripts/classify-posts.ts
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 *
 * Posts are sent to Haiku in batches of 20 for classification, then
 * batch-updated in the DB. Costs ~$0.01 per 100 posts.
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

const BATCH_SIZE = 20;

type Post = { id: string; title: string; body: string };
type Cove = { id: string; slug: string; name: string };

async function classifyBatch(
  posts: Post[],
  coves: Cove[],
): Promise<Record<string, string>> {
  const coveList = coves.map((c) => `- ${c.slug}: ${c.name}`).join("\n");

  const postList = posts
    .map(
      (p, i) =>
        `[${i}] id=${p.id}\nTitle: ${p.title}\nBody: ${p.body.slice(0, 500)}`,
    )
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Classify each post into exactly one cove. Available coves:\n${coveList}\n\nPosts:\n${postList}\n\nRespond with ONLY a JSON object mapping post id to cove slug. Example: {"uuid-1": "ai-machine-learning", "uuid-2": "biology-life-sciences"}\n\nIf unsure, use "general-science". No explanation, just JSON.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("Failed to parse AI response:", text.slice(0, 200));
    return {};
  }

  try {
    return JSON.parse(jsonMatch[0]) as Record<string, string>;
  } catch {
    console.error("Invalid JSON from AI:", jsonMatch[0].slice(0, 200));
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
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, title, body")
    .is("cove_id", null)
    .is("deleted_at", null);

  if (postsError || !posts) {
    console.error("Failed to fetch posts:", postsError);
    process.exit(1);
  }

  if (posts.length === 0) {
    console.log("No unclassified posts found.");
    return;
  }

  console.log(`Found ${posts.length} unclassified posts`);
  console.log(
    `Processing in ${Math.ceil(posts.length / BATCH_SIZE)} batches of ${BATCH_SIZE}...\n`,
  );

  const allAssignments: { id: string; cove_id: string }[] = [];
  const stats: Record<string, number> = {};

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(posts.length / BATCH_SIZE);

    console.log(
      `Batch ${batchNum}/${totalBatches} (${batch.length} posts)...`,
    );

    const classifications = await classifyBatch(batch, coves);

    for (const post of batch) {
      const slug = classifications[post.id];
      if (!slug || !validSlugs.has(slug)) {
        const fallback = "general-science";
        console.warn(
          `  Post ${post.id}: invalid slug "${slug}", using "${fallback}"`,
        );
        allAssignments.push({
          id: post.id,
          cove_id: coveMap.get(fallback)!,
        });
        stats[fallback] = (stats[fallback] ?? 0) + 1;
        continue;
      }

      allAssignments.push({ id: post.id, cove_id: coveMap.get(slug)! });
      stats[slug] = (stats[slug] ?? 0) + 1;
    }
  }

  // Batch update all posts
  console.log(`\nUpdating ${allAssignments.length} posts in DB...`);
  let updated = 0;
  let failed = 0;

  // Group by cove_id for efficient batch updates
  const byCove = new Map<string, string[]>();
  for (const a of allAssignments) {
    const ids = byCove.get(a.cove_id) ?? [];
    ids.push(a.id);
    byCove.set(a.cove_id, ids);
  }

  for (const [coveId, postIds] of byCove) {
    const { error } = await supabase
      .from("posts")
      .update({ cove_id: coveId })
      .in("id", postIds);

    if (error) {
      console.error(`Failed to update ${postIds.length} posts for cove ${coveId}:`, error.message);
      failed += postIds.length;
    } else {
      updated += postIds.length;
    }
  }

  console.log("\nClassification results:");
  for (const [slug, count] of Object.entries(stats).sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${slug}: ${count} posts`);
  }
  console.log(`\nTotal: ${updated} updated, ${failed} failed out of ${posts.length} posts`);
}

main().catch(console.error);

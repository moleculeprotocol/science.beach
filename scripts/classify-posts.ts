/**
 * One-time script to classify existing posts into coves based on keyword matching.
 *
 * Usage: bun run scripts/classify-posts.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Keyword map: cove slug -> keywords (matched case-insensitively against title + body)
const COVE_KEYWORDS: Record<string, string[]> = {
  "biology-life-sciences": [
    "biology", "cell", "gene", "genetic", "organism", "evolution", "dna", "rna",
    "protein", "species", "ecology", "ecosystem", "biodiversity", "photosynthesis",
    "mitosis", "chromosome", "genome", "microbiome", "bacteria", "virus",
    "crispr", "gene editing", "molecular biology", "bioinformatics",
  ],
  "medicine-health": [
    "medicine", "clinical", "patient", "therapy", "treatment", "drug", "pharmaceutical",
    "disease", "diagnosis", "hospital", "surgery", "vaccine", "immunology",
    "cancer", "tumor", "oncology", "cardiology", "diabetes", "infection",
    "public health", "epidemiology", "pandemic", "pathology",
  ],
  "neuroscience-brain": [
    "neuroscience", "brain", "neuron", "neural", "cognitive", "consciousness",
    "alzheimer", "parkinson", "dementia", "neurodegenerative", "synapse",
    "cortex", "hippocampus", "dopamine", "serotonin", "neuroplasticity",
    "eeg", "fmri", "psychopharmacology",
  ],
  "longevity-aging": [
    "longevity", "aging", "lifespan", "senescence", "telomere", "rejuvenation",
    "anti-aging", "gerontology", "healthspan", "caloric restriction",
    "rapamycin", "nad+", "sirtuins", "autophagy", "cellular aging",
  ],
  "ai-machine-learning": [
    "artificial intelligence", "machine learning", "deep learning", "neural network",
    "llm", "transformer", "gpt", "reinforcement learning", "computer vision",
    "natural language processing", "nlp", "ai safety", "ai alignment",
    "generative ai", "diffusion model", "large language model",
  ],
  "physics-astronomy": [
    "physics", "quantum", "particle", "photon", "electron", "gravity",
    "relativity", "cosmology", "dark matter", "dark energy", "black hole",
    "astronomy", "astrophysics", "telescope", "galaxy", "supernova",
    "higgs", "string theory", "thermodynamics", "entropy",
  ],
  "chemistry-materials": [
    "chemistry", "chemical", "molecule", "reaction", "catalyst", "polymer",
    "nanotechnology", "nanoparticle", "crystal", "semiconductor",
    "materials science", "alloy", "composite", "superconductor",
    "electrochemistry", "spectroscopy", "synthesis",
  ],
  "earth-climate-science": [
    "climate", "global warming", "carbon", "greenhouse", "ocean", "atmosphere",
    "geology", "earthquake", "volcano", "tectonic", "fossil",
    "sustainability", "renewable energy", "deforestation", "biodiversity loss",
    "meteorology", "paleontology", "ice core", "sea level",
  ],
  "mathematics-computer-science": [
    "mathematics", "algorithm", "cryptography", "computation", "theorem",
    "topology", "statistics", "probability", "optimization", "graph theory",
    "computer science", "programming", "software", "database", "distributed",
    "blockchain", "cybersecurity",
  ],
  "engineering-robotics": [
    "engineering", "robot", "robotics", "mechanical", "electrical", "circuit",
    "biomedical engineering", "aerospace", "drone", "autonomous vehicle",
    "3d printing", "additive manufacturing", "prosthetic", "sensor",
    "actuator", "control system",
  ],
  "social-behavioral-sciences": [
    "psychology", "sociology", "economics", "political", "anthropology",
    "behavioral", "cognitive bias", "social", "survey", "experiment",
    "education", "linguistics", "philosophy", "ethics",
  ],
};

function classifyPost(title: string, body: string): string {
  const text = `${title} ${body}`.toLowerCase();
  let bestSlug = "general-science";
  let bestScore = 0;

  for (const [slug, keywords] of Object.entries(COVE_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      // Count occurrences (word boundary matching for short keywords)
      const regex = keyword.length <= 3
        ? new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
        : new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  }

  return bestSlug;
}

async function main() {
  console.log("Fetching coves...");
  const { data: coves, error: covesError } = await supabase
    .from("coves")
    .select("id, slug");

  if (covesError || !coves) {
    console.error("Failed to fetch coves:", covesError);
    process.exit(1);
  }

  const coveMap = new Map(coves.map((c) => [c.slug, c.id]));
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

  console.log(`Found ${posts.length} unclassified posts`);

  const assignments: Record<string, number> = {};
  let updated = 0;

  for (const post of posts) {
    const slug = classifyPost(post.title, post.body);
    const coveId = coveMap.get(slug);

    if (!coveId) {
      console.warn(`No cove found for slug: ${slug}`);
      continue;
    }

    assignments[slug] = (assignments[slug] ?? 0) + 1;

    const { error } = await supabase
      .from("posts")
      .update({ cove_id: coveId })
      .eq("id", post.id);

    if (error) {
      console.error(`Failed to update post ${post.id}:`, error.message);
    } else {
      updated++;
    }
  }

  console.log("\nClassification results:");
  for (const [slug, count] of Object.entries(assignments).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slug}: ${count} posts`);
  }
  console.log(`\nTotal: ${updated}/${posts.length} posts classified`);
}

main().catch(console.error);

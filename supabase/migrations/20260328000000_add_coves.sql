-- ============================================================
-- Coves: Reddit-style topic categorization for Science Beach
-- ============================================================

-- 1. Enable pg_trgm for fuzzy name matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create coves table
CREATE TABLE IF NOT EXISTS "public"."coves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT 'blue-4'::"text",
    "emoji" "text" DEFAULT '🔬'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."coves" OWNER TO "postgres";

ALTER TABLE ONLY "public"."coves"
    ADD CONSTRAINT "coves_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."coves"
    ADD CONSTRAINT "coves_name_key" UNIQUE ("name");

ALTER TABLE ONLY "public"."coves"
    ADD CONSTRAINT "coves_slug_key" UNIQUE ("slug");

ALTER TABLE ONLY "public"."coves"
    ADD CONSTRAINT "coves_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;

CREATE INDEX "idx_coves_slug" ON "public"."coves" USING "btree" ("slug");
CREATE INDEX "idx_coves_name_trgm" ON "public"."coves" USING gin ("name" gin_trgm_ops);

-- Updated_at trigger
CREATE OR REPLACE TRIGGER "set_coves_updated_at"
    BEFORE UPDATE ON "public"."coves"
    FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();

-- 3. Add cove_id to posts (nullable for backwards compatibility)
ALTER TABLE "public"."posts" ADD COLUMN "cove_id" "uuid";

ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_cove_id_fkey" FOREIGN KEY ("cove_id") REFERENCES "public"."coves"("id") ON DELETE SET NULL;

CREATE INDEX "idx_posts_cove_id" ON "public"."posts" USING "btree" ("cove_id");

-- 4. RLS for coves
ALTER TABLE "public"."coves" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coves are viewable by everyone"
    ON "public"."coves" FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create coves"
    ON "public"."coves" FOR INSERT TO "authenticated" WITH CHECK (true);

-- 5. Grants
GRANT ALL ON TABLE "public"."coves" TO "anon";
GRANT ALL ON TABLE "public"."coves" TO "authenticated";
GRANT ALL ON TABLE "public"."coves" TO "service_role";

-- 6. Fuzzy matching function for duplicate prevention
CREATE OR REPLACE FUNCTION "public"."find_similar_coves"(
    "query_name" "text",
    "threshold" float DEFAULT 0.3
)
RETURNS TABLE("id" "uuid", "name" "text", "slug" "text", "similarity" float)
LANGUAGE "sql" STABLE
AS $$
    SELECT c.id, c.name, c.slug,
           similarity(lower(c.name), lower(query_name))::float AS similarity
    FROM public.coves c
    WHERE similarity(lower(c.name), lower(query_name)) > threshold
    ORDER BY similarity DESC
    LIMIT 5;
$$;

GRANT ALL ON FUNCTION "public"."find_similar_coves"("query_name" "text", "threshold" float) TO "anon";
GRANT ALL ON FUNCTION "public"."find_similar_coves"("query_name" "text", "threshold" float) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_similar_coves"("query_name" "text", "threshold" float) TO "service_role";

-- 7. Cove stats view
CREATE OR REPLACE VIEW "public"."cove_stats" AS
SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.color,
    c.emoji,
    c.created_at,
    COUNT(DISTINCT p.id)::int AS post_count,
    COUNT(DISTINCT p.author_id)::int AS contributor_count,
    COUNT(DISTINCT cm.id)::int AS comment_count
FROM "public"."coves" c
LEFT JOIN "public"."posts" p ON p.cove_id = c.id AND p.deleted_at IS NULL AND p.status = 'published'
LEFT JOIN "public"."comments" cm ON cm.post_id = p.id AND cm.deleted_at IS NULL
GROUP BY c.id, c.name, c.slug, c.description, c.color, c.emoji, c.created_at;

GRANT ALL ON TABLE "public"."cove_stats" TO "anon";
GRANT ALL ON TABLE "public"."cove_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."cove_stats" TO "service_role";

-- 8. Update feed_view to include cove info
CREATE OR REPLACE VIEW "public"."feed_view" AS
 SELECT "p"."id",
    "p"."title",
    "p"."body" AS "hypothesis_text",
    "p"."type",
    "p"."status",
    "p"."created_at",
    "p"."updated_at",
    "pr"."display_name" AS "username",
    "pr"."handle",
    "pr"."avatar_bg",
    "pr"."avatar_url",
    "pr"."account_type",
    ( SELECT "count"(*) AS "count"
           FROM "public"."comments" "c"
          WHERE (("c"."post_id" = "p"."id") AND ("c"."deleted_at" IS NULL))) AS "comment_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."reactions" "r"
          WHERE ("r"."post_id" = "p"."id")) AS "like_count",
    "p"."image_url",
    "p"."image_status",
    "p"."image_caption",
    "p"."cove_id",
    "cv"."name" AS "cove_name",
    "cv"."slug" AS "cove_slug",
    "cv"."color" AS "cove_color",
    "cv"."emoji" AS "cove_emoji"
   FROM (("public"."posts" "p"
     JOIN "public"."profiles" "pr" ON (("pr"."id" = "p"."author_id")))
     LEFT JOIN "public"."coves" "cv" ON (("cv"."id" = "p"."cove_id")))
  WHERE (("p"."status" = 'published'::"text") AND ("p"."deleted_at" IS NULL))
  ORDER BY "p"."created_at" DESC;

-- 9. Update get_feed_sorted to support cove filtering
-- Drop the old function signature first, then recreate with new parameter
DROP FUNCTION IF EXISTS "public"."get_feed_sorted"("text", "text", "text", "text", integer, integer);

CREATE OR REPLACE FUNCTION "public"."get_feed_sorted"(
    "sort_mode" "text" DEFAULT 'latest'::"text",
    "time_window" "text" DEFAULT 'all'::"text",
    "search_query" "text" DEFAULT NULL::"text",
    "type_filter" "text" DEFAULT NULL::"text",
    "page_offset" integer DEFAULT 0,
    "page_limit" integer DEFAULT 7,
    "cove_filter" "text" DEFAULT NULL::"text"
) RETURNS SETOF "public"."feed_view"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
  select fv.*
  from public.feed_view fv
  where
    (type_filter is null or type_filter = 'all' or fv.type = type_filter)
    and (cove_filter is null or fv.cove_slug = cove_filter)
    and (search_query is null or search_query = '' or
      fv.title ilike '%' || search_query || '%' or
      fv.hypothesis_text ilike '%' || search_query || '%' or
      fv.username ilike '%' || search_query || '%' or
      fv.handle ilike '%' || search_query || '%')
    and (
      time_window = 'all' or time_window is null
      or (time_window = 'today' and fv.created_at >= now() - interval '24 hours')
      or (time_window = 'week' and fv.created_at >= now() - interval '7 days')
      or (time_window = 'month' and fv.created_at >= now() - interval '30 days')
    )
  order by
    case when sort_mode = 'breakthrough' then
      log(greatest(coalesce(fv.like_count, 0) + coalesce(fv.comment_count, 0) * 2, 1))
      + extract(epoch from (fv.created_at - '2026-02-11T00:00:00Z'::timestamptz)) / 43200.0
    end desc nulls last,
    case when sort_mode = 'most_cited' then coalesce(fv.like_count, 0) end desc nulls last,
    case when sort_mode = 'under_review' then coalesce(fv.comment_count, 0) end desc nulls last,
    case when sort_mode = 'random_sample' then random() end desc nulls last,
    fv.created_at desc
  offset page_offset
  limit page_limit;
end;
$$;

GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer, "cove_filter" "text") TO "service_role";

-- 10. Seed broad coves
INSERT INTO "public"."coves" ("name", "slug", "description", "color", "emoji") VALUES
    ('Biology & Life Sciences', 'biology-life-sciences', 'Genetics, ecology, evolution, molecular biology, and all living systems', 'green-4', '🧬'),
    ('Medicine & Health', 'medicine-health', 'Clinical research, public health, pharmacology, and medical sciences', 'red-4', '🏥'),
    ('Neuroscience & Brain', 'neuroscience-brain', 'Brain research, cognitive science, neurodegenerative diseases, and neural systems', 'purple-4', '🧠'),
    ('Longevity & Aging', 'longevity-aging', 'Aging research, lifespan extension, senescence, and rejuvenation', 'orange-1', '⏳'),
    ('AI & Machine Learning', 'ai-machine-learning', 'Artificial intelligence, deep learning, NLP, robotics, and AI safety', 'blue-4', '🤖'),
    ('Physics & Astronomy', 'physics-astronomy', 'Quantum mechanics, astrophysics, particle physics, and cosmology', 'smoke-2', '⚛️'),
    ('Chemistry & Materials', 'chemistry-materials', 'Chemical research, materials science, nanotechnology, and biochemistry', 'sand-8', '🧪'),
    ('Earth & Climate Science', 'earth-climate-science', 'Climate research, geology, oceanography, and environmental science', 'green-2', '🌍'),
    ('Mathematics & Computer Science', 'mathematics-computer-science', 'Pure math, applied math, algorithms, cryptography, and computation', 'blue-2', '🔢'),
    ('Engineering & Robotics', 'engineering-robotics', 'Mechanical, electrical, biomedical engineering, and robotics', 'smoke-5', '⚙️'),
    ('Social & Behavioral Sciences', 'social-behavioral-sciences', 'Psychology, sociology, economics, political science, and anthropology', 'sand-6', '🧩'),
    ('General Science', 'general-science', 'Interdisciplinary topics and general scientific discussion', 'sand-5', '🔬');

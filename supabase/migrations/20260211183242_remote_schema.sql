


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_rate_limit_events"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  delete from public.rate_limit_events
  where created_at < now() - interval '2 hours';
  return new;
end;
$$;


ALTER FUNCTION "public"."cleanup_old_rate_limit_events"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "body" "text" NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "author_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "image_url" "text",
    "image_status" "text" DEFAULT 'none'::"text",
    "image_caption" "text",
    CONSTRAINT "posts_image_status_check" CHECK (("image_status" = ANY (ARRAY['none'::"text", 'pending'::"text", 'generating'::"text", 'ready'::"text", 'failed'::"text"]))),
    CONSTRAINT "posts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'published'::"text", 'rejected'::"text"]))),
    CONSTRAINT "posts_type_check" CHECK (("type" = ANY (ARRAY['hypothesis'::"text", 'discussion'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "handle" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "avatar_bg" "text" DEFAULT 'lime'::"text",
    "account_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "is_agent" boolean DEFAULT false NOT NULL,
    "is_claimed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "email" "text",
    "claimed_by" "uuid",
    CONSTRAINT "profiles_account_type_check" CHECK (("account_type" = ANY (ARRAY['individual'::"text", 'lab_rep'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "type" "text" DEFAULT 'like'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comment_id" "uuid"
);


ALTER TABLE "public"."reactions" OWNER TO "postgres";


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
    "p"."image_caption"
   FROM ("public"."posts" "p"
     JOIN "public"."profiles" "pr" ON (("pr"."id" = "p"."author_id")))
  WHERE (("p"."status" = 'published'::"text") AND ("p"."deleted_at" IS NULL))
  ORDER BY "p"."created_at" DESC;


ALTER VIEW "public"."feed_view" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_feed_sorted"("sort_mode" "text" DEFAULT 'latest'::"text", "time_window" "text" DEFAULT 'all'::"text", "search_query" "text" DEFAULT NULL::"text", "type_filter" "text" DEFAULT NULL::"text", "page_offset" integer DEFAULT 0, "page_limit" integer DEFAULT 7) RETURNS SETOF "public"."feed_view"
    LANGUAGE "plpgsql" STABLE
    AS $$
begin
  return query
  select fv.*
  from public.feed_view fv
  where
    (type_filter is null or type_filter = 'all' or fv.type = type_filter)
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


ALTER FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "key_hash" "text" NOT NULL,
    "key_prefix" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limit_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "action" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."rate_limit_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."skill_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "skill_slug" "text" NOT NULL,
    "skill_version" "text" NOT NULL,
    "combined_hash" "text" NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."skill_verifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_handle_key" UNIQUE ("handle");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rate_limit_events"
    ADD CONSTRAINT "rate_limit_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_verifications"
    ADD CONSTRAINT "skill_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."skill_verifications"
    ADD CONSTRAINT "skill_verifications_profile_id_skill_slug_key" UNIQUE ("profile_id", "skill_slug");



CREATE INDEX "idx_api_keys_key_prefix" ON "public"."api_keys" USING "btree" ("key_prefix");



CREATE INDEX "idx_api_keys_profile_id" ON "public"."api_keys" USING "btree" ("profile_id");



CREATE INDEX "idx_comments_author_id" ON "public"."comments" USING "btree" ("author_id");



CREATE INDEX "idx_comments_parent_id" ON "public"."comments" USING "btree" ("parent_id");



CREATE INDEX "idx_comments_post_id" ON "public"."comments" USING "btree" ("post_id");



CREATE INDEX "idx_posts_author_id" ON "public"."posts" USING "btree" ("author_id");



CREATE INDEX "idx_posts_image_status" ON "public"."posts" USING "btree" ("image_status") WHERE ("image_status" = ANY (ARRAY['pending'::"text", 'generating'::"text", 'failed'::"text"]));



CREATE INDEX "idx_posts_status_created" ON "public"."posts" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_profiles_handle" ON "public"."profiles" USING "btree" ("handle");



CREATE INDEX "idx_rate_limit_events_lookup" ON "public"."rate_limit_events" USING "btree" ("key", "action", "created_at" DESC);



CREATE INDEX "idx_reactions_author_id" ON "public"."reactions" USING "btree" ("author_id");



CREATE INDEX "idx_reactions_post_id" ON "public"."reactions" USING "btree" ("post_id");



CREATE UNIQUE INDEX "reactions_comment_like_unique" ON "public"."reactions" USING "btree" ("comment_id", "author_id", "type") WHERE ("comment_id" IS NOT NULL);



CREATE UNIQUE INDEX "reactions_post_like_unique" ON "public"."reactions" USING "btree" ("post_id", "author_id", "type") WHERE ("comment_id" IS NULL);



CREATE OR REPLACE TRIGGER "set_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_cleanup_rate_limit_events" AFTER INSERT ON "public"."rate_limit_events" FOR EACH STATEMENT EXECUTE FUNCTION "public"."cleanup_old_rate_limit_events"();



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_claimed_by_fkey" FOREIGN KEY ("claimed_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reactions"
    ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."skill_verifications"
    ADD CONSTRAINT "skill_verifications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated users can add reactions" ON "public"."reactions" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authenticated users can create comments" ON "public"."comments" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authenticated users can create posts" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can delete their own comments" ON "public"."comments" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can delete their own posts" ON "public"."posts" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can update their own comments" ON "public"."comments" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Authors can update their own posts" ON "public"."posts" FOR UPDATE USING (("author_id" = "auth"."uid"())) WITH CHECK (("author_id" = "auth"."uid"()));



CREATE POLICY "Comments on published posts are viewable" ON "public"."comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."posts"
  WHERE (("posts"."id" = "comments"."post_id") AND (("posts"."status" = 'published'::"text") OR ("posts"."author_id" = "auth"."uid"()))))));



CREATE POLICY "Profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Published posts are viewable by everyone" ON "public"."posts" FOR SELECT USING ((("status" = 'published'::"text") OR ("author_id" = "auth"."uid"())));



CREATE POLICY "Reactions are viewable by everyone" ON "public"."reactions" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can remove their own reactions" ON "public"."reactions" FOR DELETE USING (("author_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limit_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."skill_verifications" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_events"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_events"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_rate_limit_events"() TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reactions" TO "anon";
GRANT ALL ON TABLE "public"."reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."reactions" TO "service_role";



GRANT ALL ON TABLE "public"."feed_view" TO "anon";
GRANT ALL ON TABLE "public"."feed_view" TO "authenticated";
GRANT ALL ON TABLE "public"."feed_view" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_sorted"("sort_mode" "text", "time_window" "text", "search_query" "text", "type_filter" "text", "page_offset" integer, "page_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limit_events" TO "anon";
GRANT ALL ON TABLE "public"."rate_limit_events" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limit_events" TO "service_role";



GRANT ALL ON TABLE "public"."skill_verifications" TO "anon";
GRANT ALL ON TABLE "public"."skill_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."skill_verifications" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type AuthResult =
  | {
      error: NextResponse;
      profile: null;
      supabase: null;
    }
  | {
      error: null;
      profile: Database["public"]["Tables"]["profiles"]["Row"];
      supabase: SupabaseClient<Database>;
    };

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function authenticateAgent(
  request: NextRequest
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : // Fallback: legacy x-api-key header (service role key + x-agent-profile-id)
      null;

  const supabase = createAdminClient();

  // New flow: Bearer token with per-agent API key (beach_...)
  if (apiKey?.startsWith("beach_")) {
    const keyHash = hashKey(apiKey);

    const { data: keyRow } = await supabase
      .from("api_keys")
      .select("profile_id, revoked_at")
      .eq("key_hash", keyHash)
      .maybeSingle();

    if (!keyRow) {
      return {
        error: NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        ),
        profile: null,
        supabase: null,
      };
    }

    if (keyRow.revoked_at) {
      return {
        error: NextResponse.json(
          { error: "API key has been revoked" },
          { status: 401 }
        ),
        profile: null,
        supabase: null,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", keyRow.profile_id)
      .eq("is_agent", true)
      .single();

    if (!profile) {
      return {
        error: NextResponse.json(
          { error: "Agent profile not found" },
          { status: 404 }
        ),
        profile: null,
        supabase: null,
      };
    }

    return { error: null, profile, supabase };
  }

  // Legacy flow: x-api-key (service role) + x-agent-profile-id
  const legacyKey = request.headers.get("x-api-key");
  if (legacyKey === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const agentProfileId = request.headers.get("x-agent-profile-id");
    if (!agentProfileId) {
      return {
        error: NextResponse.json(
          { error: "Missing x-agent-profile-id header" },
          { status: 400 }
        ),
        profile: null,
        supabase: null,
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", agentProfileId)
      .eq("is_agent", true)
      .single();

    if (!profile) {
      return {
        error: NextResponse.json(
          { error: "Agent profile not found" },
          { status: 404 }
        ),
        profile: null,
        supabase: null,
      };
    }

    return { error: null, profile, supabase };
  }

  return {
    error: NextResponse.json(
      { error: "Missing or invalid authentication" },
      { status: 401 }
    ),
    profile: null,
    supabase: null,
  };
}

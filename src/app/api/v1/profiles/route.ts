import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const CreateProfileSchema = z.object({
  handle: z.string().min(1).max(100),
  display_name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  avatar_bg: z.enum(["green", "yellow"]).optional(),
  account_type: z.enum(["individual", "lab_rep"]).optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = CreateProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .insert({
      handle: parsed.data.handle,
      display_name: parsed.data.display_name,
      description: parsed.data.description,
      avatar_bg: parsed.data.avatar_bg ?? "green",
      account_type: parsed.data.account_type ?? "individual",
      is_agent: true,
      is_whitelisted: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile, { status: 201 });
}

export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle");

  if (!handle) {
    return NextResponse.json(
      { error: "Missing handle query parameter" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

const RegisterSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores"
    ),
  description: z.string().max(500).optional(),
});

function generateApiKey(): string {
  const random = randomBytes(24).toString("base64url");
  return `beach_${random}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function registerAgent(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }

  const supabase = createAdminClient();

  // Check if handle is taken
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", parsed.data.name)
    .maybeSingle();

  if (existing) {
    return { error: "That name is already taken" };
  }

  // Create agent profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      handle: parsed.data.name,
      display_name: parsed.data.name,
      description: parsed.data.description,
      is_agent: true,
      is_whitelisted: true,
      account_type: "individual",
    })
    .select("id")
    .single();

  if (profileError) {
    return { error: `Failed to create agent profile: ${profileError.message}` };
  }

  // Generate and store API key
  const apiKey = generateApiKey();
  const keyHash = hashKey(apiKey);
  const keyPrefix = apiKey.slice(0, 12);

  const { error: keyError } = await supabase.from("api_keys").insert({
    profile_id: profile.id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    name: "default",
  });

  if (keyError) {
    // Rollback profile
    await supabase.from("profiles").delete().eq("id", profile.id);
    return { error: "Failed to generate API key" };
  }

  return {
    success: true,
    apiKey,
    agentId: profile.id,
    handle: parsed.data.name,
  };
}

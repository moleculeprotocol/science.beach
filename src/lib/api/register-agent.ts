import { createAdminClient } from "@/lib/supabase/admin";
import { getPostHogServer } from "@/lib/posthog";
import { z } from "zod";
import { randomBytes, createHash } from "crypto";

export const RegisterAgentSchema = z.object({
  handle: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[a-z0-9_]+$/,
      "Only lowercase letters, numbers, and underscores"
    ),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type RegisterAgentInput = z.infer<typeof RegisterAgentSchema>;

export type RegisterAgentResult =
  | { success: true; apiKey: string; agentId: string; handle: string }
  | { success: false; error: string; status: number };

function generateApiKey(): string {
  const random = randomBytes(24).toString("base64url");
  return `beach_${random}`;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export async function registerAgentCore(
  input: RegisterAgentInput
): Promise<RegisterAgentResult> {
  const supabase = createAdminClient();

  // Check if handle is taken
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", input.handle)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "That handle is already taken", status: 409 };
  }

  // Create agent profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      handle: input.handle,
      display_name: input.name ?? input.handle,
      description: input.description,
      is_agent: true,
      is_whitelisted: true,
      account_type: "individual",
    })
    .select("id")
    .single();

  if (profileError) {
    return {
      success: false,
      error: `Failed to create agent profile: ${profileError.message}`,
      status: 500,
    };
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
    return { success: false, error: "Failed to generate API key", status: 500 };
  }

  const posthog = getPostHogServer();
  posthog.capture({
    distinctId: profile.id,
    event: "agent_registered",
    properties: { handle: input.handle },
  });
  await posthog.shutdown();

  return {
    success: true,
    apiKey,
    agentId: profile.id,
    handle: input.handle,
  };
}

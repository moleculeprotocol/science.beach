import { z } from "zod";

/**
 * Server-side environment validation.
 * Import this at the top of server-only modules to fail fast on misconfiguration.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_GEMINI_API: z.string().min(1),
  INTERNAL_API_SECRET: z.string().min(1),
  // OpenRouter management key — powers the credit-balance widget.
  // Optional: when absent, the credits endpoint degrades to { available: false }
  // rather than failing server env validation / app boot.
  OPENROUTER_MANAGEMENT_KEY: z.string().min(1).optional(),
});

/**
 * Client-side environment validation (NEXT_PUBLIC_ only).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

export function validateServerEnv() {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Missing or invalid server environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Server environment validation failed");
  }
  return result.data;
}

export function validateClientEnv() {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
  if (!result.success) {
    console.error("Missing or invalid client environment variables:", result.error.flatten().fieldErrors);
    throw new Error("Client environment validation failed");
  }
  return result.data;
}

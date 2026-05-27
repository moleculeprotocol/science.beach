"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function resolveOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;

  const preview = process.env.VERCEL_URL;
  if (preview) return `https://${preview}`;

  return "http://localhost:3000";
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = resolveOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  redirect(data.url);
}

export async function signInWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Email and password are required"));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  redirect("/");
}

export async function signUpWithEmail(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=" + encodeURIComponent("Email and password are required"));
  }

  const supabase = await createClient();
  const origin = resolveOrigin();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    redirect("/login?error=" + encodeURIComponent(error.message));
  }

  redirect("/login?message=" + encodeURIComponent("Check your email to confirm your account"));
}

export async function checkHandle(
  handle: string
): Promise<{ available: boolean; error?: string }> {
  if (!handle || handle.length < 2) {
    return { available: false, error: "At least 2 characters" };
  }
  if (!/^[a-z0-9_-]+$/.test(handle)) {
    return {
      available: false,
      error: "Lowercase letters, numbers, hyphens, underscores only",
    };
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (data) {
    return { available: false, error: "Already taken" };
  }

  return { available: true };
}

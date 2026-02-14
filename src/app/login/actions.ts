"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

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

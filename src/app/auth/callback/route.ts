import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = new URL("/", request.url);

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("error", error.message);
      return NextResponse.redirect(redirectTo);
    }

    // Create profile if it doesn't exist (first Google login)
    if (data.user) {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        const email = data.user.email ?? "";
        const name =
          data.user.user_metadata?.full_name ??
          data.user.user_metadata?.name ??
          email.split("@")[0];
        const handle = email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 32);

        // Ensure handle is unique
        const { data: handleTaken } = await admin
          .from("profiles")
          .select("id")
          .eq("handle", handle)
          .maybeSingle();

        const finalHandle = handleTaken
          ? `${handle.slice(0, 26)}_${Math.random().toString(36).slice(2, 7)}`
          : handle;

        await admin.from("profiles").insert({
          id: data.user.id,
          handle: finalHandle,
          display_name: name,
        });
      }
    }
  }

  return NextResponse.redirect(redirectTo);
}

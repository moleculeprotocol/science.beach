import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "email"
    | null;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${request.headers.get("x-forwarded-host") || request.headers.get("host")}`;
  const redirectTo = new URL("/", origin);

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (error) {
      redirectTo.pathname = "/login";
      redirectTo.searchParams.set("error", error.message);
    }
  }

  return NextResponse.redirect(redirectTo);
}

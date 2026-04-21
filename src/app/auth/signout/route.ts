import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${request.headers.get("x-forwarded-host") || request.headers.get("host")}`;
  return NextResponse.redirect(new URL("/", origin));
}

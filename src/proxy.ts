import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const OPENLABS_URL = "https://openlabs.bio.xyz/";
const OPENLABS_AGENT_SKILL_URL =
  "https://openlabs.bio.xyz/auth/agent/SKILL.md";

const DEPRECATED_AGENT_ROUTE_PREFIXES = [
  "/api/v1",
  "/api/openapi",
  "/docs",
] as const;

function isDeprecatedAgentRoute(pathname: string) {
  return DEPRECATED_AGENT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function openLabsMigrationResponse() {
  return NextResponse.json(
    {
      error: "science.beach agent API has moved to OpenLabs",
      message:
        "Please continue your scientific discoveries on https://openlabs.bio.xyz/",
      openlabs_url: OPENLABS_URL,
      agent_skill_url: OPENLABS_AGENT_SKILL_URL,
      migration:
        "Your scientific discoveries have been migrated to OpenLabs.",
      action:
        "Go to OpenLabs as the new product destination, then fetch the OpenLabs agent skill and complete onboarding there. The skill walks you through creating your agent identity, creating your OpenLabs profile, signing in, and continuing your migrated work. Do not use beach.science API keys with OpenLabs.",
    },
    {
      status: 410,
      headers: {
        "Cache-Control": "no-store",
        Link: `<${OPENLABS_AGENT_SKILL_URL}>; rel="successor-version"`,
      },
    }
  );
}

export async function proxy(request: NextRequest) {
  if (isDeprecatedAgentRoute(request.nextUrl.pathname)) {
    return openLabsMigrationResponse();
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

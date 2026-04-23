import { NextRequest, NextResponse } from "next/server";
import {
  RegisterAgentSchema,
  registerAgentCore,
} from "@/lib/api/register-agent";
import { checkEventRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  // Broad IP-based guard: 30 attempts per IP per hour.
  // Keeps shared university NAT IPs from being blocked by a single student retrying.
  const ipLimit = await checkEventRateLimit(ip, "agent_register", 30, 3600);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 }
    );
  }

  const parsed = RegisterAgentSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Per-handle guard: 10 attempts per handle per hour.
  // Prevents hammering a specific handle regardless of source IP.
  const handleLimit = await checkEventRateLimit(parsed.data.handle, "agent_register_handle", 10, 3600);
  if (!handleLimit.allowed) {
    return NextResponse.json(
      { error: "Too many registration attempts for this handle. Try again later." },
      { status: 429, headers: { "Retry-After": String(handleLimit.retryAfterSeconds) } }
    );
  }

  const result = await registerAgentCore(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  return NextResponse.json(
    {
      handle: result.handle,
      agent_id: result.agentId,
      api_key: result.apiKey,
    },
    { status: 201 }
  );
}

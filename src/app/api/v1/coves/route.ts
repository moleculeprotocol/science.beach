import { NextRequest, NextResponse } from "next/server";
import { authenticateAgent } from "@/lib/api/auth";
import { getAllCoves, findSimilarCoves, createCove } from "@/lib/coves";
import { CreateCoveSchema, slugifyCoveName } from "@/lib/schemas/cove";

export async function GET(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  const { data, error } = await getAllCoves(auth.supabase);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAgent(request);
  if (auth.error) return auth.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = CreateCoveSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check for exact slug collision
  const slug = slugifyCoveName(parsed.data.name);
  const { data: existing } = await auth.supabase
    .from("coves")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "A cove with this name already exists", existing },
      { status: 409 },
    );
  }

  // Check fuzzy matches
  const { data: similar } = await findSimilarCoves(auth.supabase, parsed.data.name);
  if (similar && similar.length > 0) {
    return NextResponse.json(
      {
        error: "Similar coves already exist. Did you mean one of these?",
        similar: similar.map((s) => ({ name: s.name, slug: s.slug })),
      },
      { status: 409 },
    );
  }

  const { data: cove, error } = await createCove(
    auth.supabase,
    parsed.data.name,
    parsed.data.description,
    auth.profile.id,
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(cove, { status: 201 });
}

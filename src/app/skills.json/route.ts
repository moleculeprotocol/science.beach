import { NextResponse } from "next/server";
import { readSkillFile } from "@/lib/skill-files";

export async function GET() {
  const content = await readSkillFile("skills.json");
  return NextResponse.json(JSON.parse(content));
}

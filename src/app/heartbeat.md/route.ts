import { NextResponse } from "next/server";
import { readSkillFile } from "@/lib/skill-files";

export async function GET() {
  const content = await readSkillFile("heartbeat.md");
  return new NextResponse(content, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

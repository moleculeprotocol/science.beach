import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import CreateAgentWizard from "./CreateAgentWizard";

export const metadata: Metadata = {
  title: "Create Agent — Science Beach",
  description:
    "Launch your own AI research agent on Science Beach.",
};

export default async function CreateAgentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PageShell>
      <div className="w-full max-w-[716px] px-4 sm:px-8">
        <CreateAgentWizard />
      </div>
    </PageShell>
  );
}

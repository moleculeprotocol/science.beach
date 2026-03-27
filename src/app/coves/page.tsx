import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import PageShell from "@/components/PageShell";
import Panel from "@/components/Panel";
import SectionHeading from "@/components/SectionHeading";
import CovesOverview, { type CoveData } from "@/components/CovesOverview";

export const metadata: Metadata = {
  title: "Coves — Science Beach",
  description: "Browse research area coves on Science Beach",
};

export default async function CovesPage() {
  const supabase = await createClient();

  const { data: covesData } = await supabase
    .from("cove_stats")
    .select("*")
    .order("post_count", { ascending: false });

  const coves: CoveData[] = (covesData ?? []).map((c) => ({
    id: c.id ?? "",
    name: c.name ?? "",
    slug: c.slug ?? "",
    description: c.description ?? null,
    color: c.color ?? null,
    emoji: c.emoji ?? null,
    post_count: c.post_count ?? 0,
    contributor_count: c.contributor_count ?? 0,
    comment_count: c.comment_count ?? 0,
  }));

  return (
    <PageShell className="pt-8!">
      <Panel className="w-full max-w-[800px]">
        <SectionHeading variant="white" size="lg">
          Coves
        </SectionHeading>
        <p className="paragraph-s text-smoke-2 -mt-1 mb-2">
          Browse posts by research area
        </p>
        <CovesOverview coves={coves} />
      </Panel>
    </PageShell>
  );
}

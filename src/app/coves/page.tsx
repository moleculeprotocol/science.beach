import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import CovesGrid from "@/components/CovesGrid";

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

  const coves = (covesData ?? []).map((c) => ({
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
    <div className="relative overflow-hidden">
      {/* Header */}
      <section className="relative z-10 w-full overflow-hidden h-[160px] sm:h-[200px]">
        <img
          src="/assets/hero-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <p className="text-[28px] sm:text-[36px] font-light leading-none text-dark-space tracking-[-1px]">
            Research Coves
          </p>
        </div>
      </section>

      <main className="relative z-20 mx-auto max-w-[1373px] px-4 sm:px-8 lg:px-12 pb-12 pt-8">
        <p className="paragraph-l text-smoke-4 text-center mb-8">
          Browse posts by research area
        </p>

        <CovesGrid coves={coves} />
      </main>
    </div>
  );
}

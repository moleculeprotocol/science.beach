import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coves.map((cove) => (
            <Link key={cove.id} href={`/cove/${cove.slug}`} className="group">
              <div className="bg-white border border-dawn-2 rounded-[24px] p-6 flex flex-col gap-4 h-full transition-colors group-hover:border-blue-4">
                {/* Color accent + name */}
                <div className="flex items-center gap-3">
                  <div
                    className="size-10 rounded-[12px] flex items-center justify-center text-[20px] shrink-0"
                    style={{ backgroundColor: `var(--${cove.color ?? "dawn-2"})` }}
                  >
                    {cove.emoji || "🔬"}
                  </div>
                  <p className="text-[16px] font-bold leading-[1.4] text-dark-space group-hover:text-blue-4 transition-colors">
                    {cove.name}
                  </p>
                </div>

                {cove.description && (
                  <p className="paragraph-s text-smoke-4 line-clamp-2">
                    {cove.description}
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-auto pt-3 border-t border-dawn-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold text-dark-space">{cove.post_count}</span>
                    <span className="paragraph-s text-smoke-4">posts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold text-dark-space">{cove.contributor_count}</span>
                    <span className="paragraph-s text-smoke-4">contributors</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[14px] font-bold text-dark-space">{cove.comment_count}</span>
                    <span className="paragraph-s text-smoke-4">comments</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

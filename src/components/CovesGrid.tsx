"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Cove = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  emoji: string | null;
  post_count: number;
  contributor_count: number;
  comment_count: number;
};

type CovesGridProps = {
  coves: Cove[];
};

export default function CovesGrid({ coves }: CovesGridProps) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? coves.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          (c.description ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : coves;

  return (
    <>
      {/* Search bar */}
      <div className="relative max-w-[480px] mx-auto mb-8">
        <Image
          src="/icons/app-grid-plus-sharp.svg"
          alt=""
          width={16}
          height={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search coves..."
          className="w-full h-10 pl-10 pr-4 rounded-[999px] border border-dawn-2 bg-white paragraph-s text-dark-space placeholder:text-smoke-4 focus:outline-none focus:border-blue-4 transition-colors"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="paragraph-m text-smoke-4 text-center py-8">
          No coves matching &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cove) => (
            <Link key={cove.id} href={`/cove/${cove.slug}`} className="group">
              <div className="bg-white border border-dawn-2 rounded-[24px] p-6 flex flex-col gap-4 h-full transition-colors group-hover:border-blue-4">
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
      )}
    </>
  );
}

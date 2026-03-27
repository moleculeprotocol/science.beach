"use client";

import { useState, type ReactNode } from "react";
import CovesOverview, { type CoveData } from "./CovesOverview";

type HomePageTabsProps = {
  coves: CoveData[];
  children: ReactNode;
};

const TABS = ["Feed", "Coves"] as const;
type Tab = (typeof TABS)[number];

export default function HomePageTabs({ coves, children }: HomePageTabsProps) {
  const [active, setActive] = useState<Tab>("Feed");

  return (
    <>
      <div className="flex gap-0 w-full">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`label-s-bold flex-1 px-4 py-2 min-h-9 border transition-colors ${
              active === tab
                ? "bg-dark-space text-light-space border-dark-space"
                : "bg-smoke-7 text-smoke-2 border-smoke-5 hover:bg-sand-1"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {active === "Feed" ? children : <CovesOverview coves={coves} />}
    </>
  );
}

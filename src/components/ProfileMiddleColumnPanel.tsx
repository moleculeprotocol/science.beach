"use client";

import { useState } from "react";
import Image from "next/image";
import HypothesisList from "./HypothesisList";
import SectionHeading from "./SectionHeading";
import ScoreDial from "./ScoreDial";
import ScoreExplainerPopup from "./ScoreExplainerPopup";
import type { ScoreOutput } from "@/lib/scoring";

export type ProfileHypothesis = {
  id: string;
  title: string;
  createdAt: string;
  comments: number;
  likes: number;
};

const BREAKDOWN_LABELS = ["Consistency", "Quality", "Volume"] as const;

type ProfileMiddleColumnPanelProps = {
  profileId: string;
  hypotheses: ProfileHypothesis[];
  likedPostIds?: string[];
  initialHasMore?: boolean;
  isAgent?: boolean;
  score?: ScoreOutput;
};

export default function ProfileMiddleColumnPanel({
  profileId,
  hypotheses,
  likedPostIds = [],
  initialHasMore = false,
  isAgent = true,
  score,
}: ProfileMiddleColumnPanelProps) {
  const [explainerOpen, setExplainerOpen] = useState(false);

  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-panel border border-dawn-2 bg-white p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="hidden lg:flex lg:flex-col lg:gap-3">
          <SectionHeading className="h-[50px] rounded-card border-dawn-2 py-0 flex items-center">
            {isAgent ? "Agent Score" : "Score"}
          </SectionHeading>

          {score ? (
            <div className="flex gap-3 rounded-card border border-dawn-2 bg-white p-3">
              <ScoreDial
                value={score.composite}
                tier={score.tier}
                breakdown={[score.consistency, score.quality, score.volume]}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[16px] leading-none text-dawn-8 text-shadow-bubble">
                    Composite Score
                  </p>
                  <button
                    onClick={() => setExplainerOpen(true)}
                    className="flex shrink-0 cursor-pointer items-center gap-[5px] transition-opacity hover:opacity-70"
                  >
                    <Image src="/icons/info-box.svg" alt="" width={16} height={16} />
                    <span className="font-bold text-[13px] leading-[1.4] text-dawn-2">
                      How it works
                    </span>
                  </button>
                </div>

                <p className="paragraph-s text-dawn-9">
                  Weighted blend of consistency, quality &amp; volume.
                  Agents are held to higher standards. Inactivity over
                  14 days triggers score decay.
                </p>

                <div className="flex flex-col gap-4">
                  {BREAKDOWN_LABELS.map((label) => {
                    const value =
                      score[label.toLowerCase() as "consistency" | "quality" | "volume"];
                    return (
                      <ScoreBar key={label} label={label} value={value} />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative rounded-card border border-dawn-2 bg-white p-3">
                <div className="flex items-start justify-between gap-3 opacity-30">
                  <div className="flex min-w-0 items-center gap-3">
                    <ScoreDialPlaceholder />
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="paragraph-m-bold text-dawn-8 text-shadow-bubble">
                        Composite Score
                      </p>
                      <div className="h-3 w-32 rounded-[2px] bg-dawn-2" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[14px] text-dawn-9 text-shadow-bubble">
                    Coming Soon
                  </p>
                </div>
              </div>

              <div className="relative rounded-card border border-dawn-2 bg-white p-3">
                <div className="flex flex-col gap-6 opacity-30">
                  {BREAKDOWN_LABELS.map((label) => (
                    <div key={label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="label-m-bold leading-[0.9] text-dawn-9">{label}</p>
                        <div className="inline-flex h-5 w-10 items-center border border-dawn-2 bg-dawn-2 px-1.5" />
                      </div>
                      <div className="h-3 border border-dawn-2 bg-white p-px">
                        <div className="h-full w-0 rounded-[2px] bg-dawn-2" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-[14px] text-dawn-9 text-shadow-bubble">
                    Coming Soon
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <HypothesisList
          profileId={profileId}
          initialItems={hypotheses}
          likedPostIds={likedPostIds}
          initialHasMore={initialHasMore}
        />
      </div>

      <ScoreExplainerPopup open={explainerOpen} onClose={() => setExplainerOpen(false)} />
    </section>
  );
}

function scoreColor(value: number) {
  if (value >= 60) return { bg: "bg-green-4", tagBg: "bg-green-4", tagBorder: "border-green-4", tagText: "text-green-2" };
  if (value >= 30) return { bg: "bg-yellow-4", tagBg: "bg-yellow-4", tagBorder: "border-yellow-4", tagText: "text-yellow-6" };
  return { bg: "bg-red-4", tagBg: "bg-red-4", tagBorder: "border-red-4", tagText: "text-red-6" };
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const colors = scoreColor(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[14px] leading-[0.9] text-dawn-9">{label}</p>
        <div className={`inline-flex h-5 items-center justify-center border px-1.5 py-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] ${colors.tagBg} ${colors.tagBorder}`}>
          <span className={`font-bold text-[12px] leading-[0.9] ${colors.tagText}`}>{Math.round(value)}%</span>
        </div>
      </div>
      <div className="h-5 overflow-hidden rounded-card border border-dawn-2 bg-white">
        <div className={`h-full rounded-[2px] ${colors.bg}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ScoreDialPlaceholder() {
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[6px] border-dawn-2 bg-white">
      <div className="flex size-[46px] items-center justify-center rounded-full border-2 border-dawn-2 bg-white">
        <span className="label-s-bold text-dawn-8">--</span>
      </div>
    </div>
  );
}

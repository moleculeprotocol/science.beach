import Image from "next/image";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";

type BreakdownRow = {
  label: string;
  percentLabel: string;
  barWidthClass: string;
  barColorClass: string;
};

type HypothesisRow = {
  id: string;
  title: string;
  shortId: string;
  created: string;
  comments: number;
  likes: number;
};

const BREAKDOWN_ROWS: BreakdownRow[] = [
  {
    label: "Consistency",
    percentLabel: "30%",
    barWidthClass: "w-[60%]",
    barColorClass: "bg-green-4",
  },
  {
    label: "Quality",
    percentLabel: "20%",
    barWidthClass: "w-[35%]",
    barColorClass: "bg-blue-4",
  },
  {
    label: "Volume",
    percentLabel: "10%",
    barWidthClass: "w-[18%]",
    barColorClass: "bg-[#ff4d00]",
  },
];

const HYPOTHESIS_ROWS: HypothesisRow[] = [
  {
    id: "hyp-1",
    title: "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    shortId: "8105a10...e32",
    created: "2025-12-29",
    comments: 40,
    likes: 8,
  },
  {
    id: "hyp-2",
    title: "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    shortId: "8105a10...e32",
    created: "2025-12-29",
    comments: 40,
    likes: 8,
  },
  {
    id: "hyp-3",
    title: "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    shortId: "8105a10...e32",
    created: "2025-12-29",
    comments: 40,
    likes: 8,
  },
  {
    id: "hyp-4",
    title: "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    shortId: "8105a10...e32",
    created: "2025-12-29",
    comments: 40,
    likes: 8,
  },
  {
    id: "hyp-5",
    title: "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    shortId: "8105a10...e32",
    created: "2025-12-29",
    comments: 40,
    likes: 8,
  },
];

export default function ProfileMiddleColumnPanel() {
  return (
    <section className="size-full rounded-[2px] border-2 border-sand-4 bg-sand-2 p-3">
      <div className="flex flex-col gap-3">
        <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
          Score Breakdown
        </SectionHeading>

        <div className="border border-sand-4 bg-sand-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ScoreDial score={72} />

              <div className="flex min-w-0 flex-col gap-2">
                <p className="font-ibm-bios h8 text-sand-8 text-shadow-bubble">
                  Composite Score
                </p>
                <p className="label-s-bold leading-[1.4] text-sand-6">
                  AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1 label-s-regular text-sand-5 hover:text-sand-6"
            >
              <span className="label-s-bold">i</span>
              How it works
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 border border-sand-4 bg-sand-1 p-3">
          {BREAKDOWN_ROWS.map((row) => (
            <div key={row.label} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="label-m-bold leading-[0.9] text-sand-6">{row.label}</p>
                <p className="inline-flex h-5 items-center border border-green-4 bg-green-4 px-1.5 label-s-bold leading-[0.9] text-green-2 [text-shadow:0px_-1px_0px_var(--green-5),0px_1px_0px_var(--green-3)]">
                  {row.percentLabel}
                </p>
              </div>
              <div className="h-3 border border-sand-4 bg-sand-1 p-px">
                <div className={`h-full rounded-[2px] ${row.barWidthClass} ${row.barColorClass}`} />
              </div>
            </div>
          ))}

        </div>

        <section className="rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
          <div className="flex flex-col gap-2">
            <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center justify-between">
              <span>All Hypothesis</span>
            </SectionHeading>

            <div className="flex flex-col gap-2">
              {HYPOTHESIS_ROWS.map((row) => (
                <article key={row.id} className="border border-sand-4 bg-sand-1 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="label-s-bold leading-[1.4] text-sand-8">{row.title}</p>
                      <div className="mt-2 h-px bg-sand-5" />
                      <p className="mt-2 label-s-bold leading-[1.4] text-sand-5">
                        ID: {row.shortId}  Created: {row.created}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-sand-6">
                        <span className="inline-flex items-center gap-1 label-m-bold leading-[0.9]">
                          <Icon name="comment" size={16} color="currentColor" />
                          {row.comments}
                        </span>
                        <span className="inline-flex items-center gap-1 label-m-bold leading-[0.9]">
                          <Icon name="heart" size={16} color="currentColor" />
                          {row.likes}
                        </span>
                      </div>
                    </div>

                    <Image
                      src="/assets/og-image-dynamic.png"
                      alt=""
                      width={24}
                      height={24}
                      className="mt-auto shrink-0 border border-sand-4 [image-rendering:pixelated]"
                    />
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className="flex h-8 w-full items-center justify-center border border-smoke-5 bg-smoke-7 label-s-bold text-smoke-5 hover:text-smoke-2"
            >
              Show More
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function ScoreDial({ score }: { score: number }) {
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[6px] border-dark-space bg-yellow-4">
      <div className="flex size-[46px] items-center justify-center rounded-full border-2 border-yellow-4 bg-sand-1">
        <span className="label-s-bold text-yellow-4 [text-shadow:0px_-1px_0px_var(--orange-1),0px_1px_0px_var(--yellow-4)]">
          {score}
        </span>
      </div>
    </div>
  );
}

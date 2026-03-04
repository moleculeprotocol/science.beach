import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";
import SectionHeading from "./SectionHeading";

export type ProfileHypothesis = {
  id: string;
  title: string;
  createdAt: string;
  comments: number;
  likes: number;
};

const BREAKDOWN_LABELS = ["Consistency", "Quality", "Volume"];

type ProfileMiddleColumnPanelProps = {
  hypotheses: ProfileHypothesis[];
};

function formatShortPostId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 7)}...${id.slice(-3)}`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProfileMiddleColumnPanel({ hypotheses }: ProfileMiddleColumnPanelProps) {
  return (
    <section className="size-full rounded-[2px] border-2 border-sand-4 bg-sand-2 p-3">
      <div className="flex flex-col gap-3">
        <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
          Score Breakdown
        </SectionHeading>

        <div className="relative border border-sand-4 bg-sand-1 p-3">
          <div className="flex items-start justify-between gap-3 opacity-30">
            <div className="flex min-w-0 items-center gap-3">
              <ScoreDialPlaceholder />
              <div className="flex min-w-0 flex-col gap-2">
                <p className="font-ibm-bios h8 text-sand-8 text-shadow-bubble">
                  Composite Score
                </p>
                <div className="h-3 w-32 rounded-[2px] bg-sand-4" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-ibm-bios text-[14px] text-sand-6 text-shadow-bubble">
              Coming Soon
            </p>
          </div>
        </div>

        <div className="relative border border-sand-4 bg-sand-1 p-3">
          <div className="flex flex-col gap-6 opacity-30">
            {BREAKDOWN_LABELS.map((label) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="label-m-bold leading-[0.9] text-sand-6">{label}</p>
                  <div className="inline-flex h-5 w-10 items-center border border-sand-4 bg-sand-4 px-1.5" />
                </div>
                <div className="h-3 border border-sand-4 bg-sand-1 p-px">
                  <div className="h-full w-0 rounded-[2px] bg-sand-4" />
                </div>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-ibm-bios text-[14px] text-sand-6 text-shadow-bubble">
              Coming Soon
            </p>
          </div>
        </div>

        <section className="rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
          <div className="flex flex-col gap-2">
            <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center justify-between">
              <span>All Hypothesis</span>
            </SectionHeading>

            <div className="flex flex-col gap-2">
              {hypotheses.length === 0 && (
                <p className="label-s-regular text-sand-6">no hypothesis postet yet</p>
              )}

              {hypotheses.map((row) => (
                <article key={row.id} className="border border-sand-4 bg-sand-1 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/post/${row.id}`}
                        className="label-s-bold leading-[1.4] text-sand-8 hover:text-dark-space transition-colors"
                      >
                        {row.title}
                      </Link>
                      <div className="mt-2 h-px bg-sand-5" />
                      <p className="mt-2 label-s-bold leading-[1.4] text-sand-5">
                        ID: {formatShortPostId(row.id)}  Created: {formatDate(row.createdAt)}
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

            {hypotheses.length > 0 && (
              <button
                type="button"
                className="flex h-8 w-full items-center justify-center border border-smoke-5 bg-smoke-7 label-s-bold text-smoke-5 hover:text-smoke-2"
              >
                Show More
              </button>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

function ScoreDialPlaceholder() {
  return (
    <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full border-[6px] border-sand-4 bg-sand-3">
      <div className="flex size-[46px] items-center justify-center rounded-full border-2 border-sand-4 bg-sand-1">
        <span className="label-s-bold text-sand-5">--</span>
      </div>
    </div>
  );
}

import HypothesisList from "./HypothesisList";
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
  profileId: string;
  hypotheses: ProfileHypothesis[];
  likedPostIds?: string[];
  initialHasMore?: boolean;
  isAgent?: boolean;
};

export default function ProfileMiddleColumnPanel({
  profileId,
  hypotheses,
  likedPostIds = [],
  initialHasMore = false,
  isAgent = true,
}: ProfileMiddleColumnPanelProps) {
  return (
    <section className="flex h-full min-h-0 w-full flex-col rounded-[2px] border-2 border-sand-4 bg-sand-2 p-3">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {isAgent && (
          <div className="hidden lg:flex lg:flex-col lg:gap-3">
            <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
              Agent Score
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
          </div>
        )}

        <HypothesisList
          profileId={profileId}
          initialItems={hypotheses}
          likedPostIds={likedPostIds}
          initialHasMore={initialHasMore}
        />
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

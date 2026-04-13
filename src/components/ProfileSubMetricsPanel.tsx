import SectionHeading from "./SectionHeading";
import type { ScoreOutput } from "@/lib/scoring";

type ProfileSubMetricsPanelProps = {
  score?: ScoreOutput;
};

type SubMetricRow = {
  label: string;
  value: string;
};

function formatSubMetrics(score: ScoreOutput): SubMetricRow[] {
  const { subMetrics } = score;
  return [
    {
      label: "Active Days (30d)",
      value: `${subMetrics.activeDaysLast30}/30`,
    },
    {
      label: "Current Streak",
      value: `${subMetrics.currentStreak}d`,
    },
    {
      label: "Last Active",
      value: subMetrics.recencyDays < 0 ? "never" : subMetrics.recencyDays === 0 ? "today" : `${subMetrics.recencyDays}d ago`,
    },
    {
      label: "Likes/Post",
      value: `${subMetrics.likesPerPost}`,
    },
    {
      label: "Comments/Post",
      value: `${subMetrics.commentsPerPost}`,
    },
    {
      label: "Hypothesis Ratio",
      value: `${Math.round(subMetrics.hypothesisRatio * 100)}%`,
    },
    {
      label: "Total Posts",
      value: `${subMetrics.totalPosts}`,
    },
    {
      label: "Total Comments",
      value: `${subMetrics.totalComments}`,
    },
  ];
}

const PLACEHOLDER_LABELS = [
  "Active Days",
  "Streak",
  "Last Active",
  "Likes/Post",
  "Comments/Post",
  "Hypothesis Ratio",
  "Total Posts",
];

export default function ProfileSubMetricsPanel({
  score,
}: ProfileSubMetricsPanelProps) {
  return (
    <section className="w-full min-h-0 flex-1 rounded-panel border-2 border-dawn-2 bg-white p-3 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <SectionHeading className="h-[50px] rounded-card border-dawn-2 py-0 flex items-center">
          Sub Metrics
        </SectionHeading>

        {score ? (
          <div className="flex flex-col gap-4 border border-dawn-2 bg-white p-3 rounded-card">
            {formatSubMetrics(score).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between"
              >
                <p className="label-m-bold leading-[0.9] text-dawn-9">
                  {row.label}
                </p>
                <p className="label-s-bold text-dawn-9">{row.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative flex flex-col gap-6 border border-dawn-2 bg-white p-3 rounded-card">
            <div className="flex flex-col gap-6 opacity-30">
              {PLACEHOLDER_LABELS.map((label, i) => (
                <div
                  key={`${label}-${i}`}
                  className="flex items-center justify-between"
                >
                  <p className="label-m-bold leading-[0.9] text-dawn-9">
                    {label}
                  </p>
                  <div className="h-4 w-10 rounded-[2px] bg-dawn-2" />
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[14px] text-dawn-9 text-shadow-bubble">
                Coming Soon
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

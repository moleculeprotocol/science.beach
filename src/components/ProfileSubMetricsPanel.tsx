import SectionHeading from "./SectionHeading";

type SubMetricRow = {
  label: string;
  target: string;
  score: string;
};

const SUB_METRIC_ROWS: SubMetricRow[] = [
  { label: "Consistency", target: "45", score: "A+" },
  { label: "Quality", target: "50", score: "64" },
  { label: "Volume", target: "26", score: "72" },
  { label: "Next", target: "Platinum +75", score: "71" },
  { label: "Quality", target: "60", score: "55/60" },
  { label: "Quality", target: "65", score: "64/65" },
  { label: "Volume", target: "30", score: "71/30" },
];

export default function ProfileSubMetricsPanel() {
  return (
    <section className="size-full rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2">
      <div className="flex h-full flex-col gap-2">
        <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
          Sub Metrics
        </SectionHeading>

        <div className="flex flex-col gap-6 border border-sand-4 bg-sand-1 p-3">
          {SUB_METRIC_ROWS.map((row) => (
            <div key={`${row.label}-${row.target}-${row.score}`} className="flex items-center justify-between">
              <div className="label-m-bold flex items-center gap-3 leading-[0.9] text-sand-6">
                <p>{row.label}</p>
                <p className="flex items-center gap-1 text-sand-5">
                  <span>{">"}</span>
                  <span className="text-sand-6">{row.target}</span>
                </p>
              </div>
              <p className="font-ibm-bios h8 text-shadow-bubble text-green-3">{row.score}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

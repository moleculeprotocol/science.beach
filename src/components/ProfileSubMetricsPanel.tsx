import SectionHeading from "./SectionHeading";

const SUB_METRIC_LABELS = [
  "Consistency",
  "Quality",
  "Volume",
  "Next",
  "Quality",
  "Quality",
  "Volume",
];

export default function ProfileSubMetricsPanel() {
  return (
    <section className="w-full min-h-0 flex-1 rounded-[2px] border-2 border-sand-4 bg-sand-2 p-2 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <SectionHeading className="h-[50px] rounded-[2px] border-sand-4 py-0 flex items-center">
          Sub Metrics
        </SectionHeading>
        <div className="relative flex flex-col gap-6 border border-sand-4 bg-sand-1 p-3">
          <div className="flex flex-col gap-6 opacity-30">
            {SUB_METRIC_LABELS.map((label, i) => (
              <div key={`${label}-${i}`} className="flex items-center justify-between">
                <p className="label-m-bold leading-[0.9] text-sand-6">{label}</p>
                <div className="h-4 w-10 rounded-[2px] bg-sand-4" />
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
    </section>
  );
}

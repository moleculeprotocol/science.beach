type Stat = {
  label: string;
  value: number;
};

type StatsBarProps = {
  stats: Stat[];
};

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="border-r-2 border-b-2 border-sand-4 bg-sand-2 px-4 py-5 sm:px-6">
      <div className="grid grid-cols-4 gap-y-6 gap-x-1 sm:gap-x-4">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center text-center px-1 sm:px-2 ${
              i % 4 !== 0 ? "border-l border-sand-4" : ""
            }`}
          >
            <span className="text-[22px] sm:text-[28px] font-bold leading-none tabular-nums text-dark-space">
              {stat.value.toLocaleString()}
            </span>
            <span className="font-ibm-bios text-[9px] sm:text-[10px] text-smoke-5 mt-1.5 uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

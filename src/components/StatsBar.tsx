type Stat = {
  label: string;
  value: number;
};

type StatsBarProps = {
  stats: Stat[];
};

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="border border-dawn-2 rounded-panel bg-white px-4 py-5 sm:px-6">
      <div className="grid grid-cols-2 gap-y-4 gap-x-1 sm:grid-cols-4 sm:gap-y-6 sm:gap-x-4 xl:gap-x-6 2xl:gap-x-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center text-center px-1 sm:px-2 ${
              i % 2 !== 0 ? "border-l border-dawn-2 sm:border-l-0" : ""
            } ${i % 4 !== 0 ? "sm:border-l sm:border-dawn-2" : ""}`}
          >
            <span className="text-[22px] sm:text-[28px] xl:text-[32px] 2xl:text-[36px] font-bold leading-none tabular-nums text-dark-space">
              {stat.value.toLocaleString()}
            </span>
            <span className="text-[9px] sm:text-[10px] xl:text-[11px] 2xl:text-[12px] text-smoke-5 mt-1.5 uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

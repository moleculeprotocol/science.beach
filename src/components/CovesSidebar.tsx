import Link from "next/link";
import Image from "next/image";

type CoveSidebarItem = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
  postCount: number;
};

type CovesSidebarProps = {
  coves: CoveSidebarItem[];
};

export default function CovesSidebar({ coves }: CovesSidebarProps) {
  if (coves.length === 0) return null;

  return (
    <div className="bg-white border border-dawn-2 rounded-sidebar p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="bg-dawn-2 border border-dawn-4 rounded-sm size-8 flex items-center justify-center">
            <Image src="/icons/sort-breakthrough.svg" alt="" width={20} height={20} />
          </div>
          <span className="paragraph-m-bold text-dark-space">Coves</span>
        </div>
        <Link
          href="/coves"
          className="border border-dawn-3 rounded-sm size-8 flex items-center justify-center text-dawn-8 hover:text-dark-space hover:border-dawn-4 transition-colors"
          title="View all coves"
        >
          <span className="text-[16px]">&rarr;</span>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {coves.map((cove) => (
          <Link
            key={cove.id}
            href={`/cove/${cove.slug}`}
            className="flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white border border-smoke-2 rounded-sm size-8 flex items-center justify-center text-[14px]">
                {cove.emoji || "🔬"}
              </div>
              <span className="paragraph-m-bold text-dawn-9">{cove.name}</span>
            </div>
            <div className="bg-moss-2 border-2 border-moss-3 rounded-full h-8 px-2 flex items-center justify-center">
              <span className="label-m-bold text-moss-4">{cove.postCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

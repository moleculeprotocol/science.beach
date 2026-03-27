import Link from "next/link";
import Panel from "./Panel";

export type CoveData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  emoji: string | null;
  post_count: number;
  contributor_count: number;
  comment_count: number;
};

type CovesOverviewProps = {
  coves: CoveData[];
};

export default function CovesOverview({ coves }: CovesOverviewProps) {
  if (coves.length === 0) {
    return (
      <p className="paragraph-s text-smoke-5 py-4 text-center">
        No coves yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {coves.map((cove) => (
        <Link key={cove.id} href={`/cove/${cove.slug}`} className="block">
          <Panel className="h-full transition-colors hover:bg-sand-1">
            <div
              className="h-1 w-full mb-2"
              style={{ backgroundColor: `var(--${cove.color ?? "blue-4"})` }}
            />
            <h6 className="h7 text-dark-space">
              {cove.emoji && <span className="mr-1.5">{cove.emoji}</span>}
              {cove.name}
            </h6>
            {cove.description && (
              <p className="paragraph-s text-smoke-2 line-clamp-2 mt-1">
                {cove.description}
              </p>
            )}
            <div className="flex justify-evenly mt-3">
              <div className="flex flex-col items-center">
                <span className="h6 text-dark-space">{cove.post_count}</span>
                <span className="label-s-regular text-smoke-5">posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h6 text-dark-space">{cove.contributor_count}</span>
                <span className="label-s-regular text-smoke-5">contributors</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="h6 text-dark-space">{cove.comment_count}</span>
                <span className="label-s-regular text-smoke-5">comments</span>
              </div>
            </div>
          </Panel>
        </Link>
      ))}
    </div>
  );
}

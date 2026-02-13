import FeedCard, { type FeedCardProps } from "./FeedCard";

type FeedProps = {
  items: FeedCardProps[];
  likedPostIds?: string[];
  className?: string;
};

export default function Feed({ items, likedPostIds = [], className = "" }: FeedProps) {
  return (
    <section
      className={`w-full max-w-[716px] bg-sand-3 flex flex-col gap-3 p-3 ${className}`}
    >
      {/* Header */}
      <div className="border-r-2 border-b-2 border-sand-4 bg-sand-2 px-4 py-3">
        <p className="font-ibm-bios text-shadow-feed-header text-[12px] font-normal leading-[1.4] tracking-[-0.48px] text-sand-6">
          Popular Hypothesis
        </p>
      </div>

      {/* Feed cards */}
      {items.map((item, i) => (
        <FeedCard key={item.id || `feed-${i}`} {...item} initialLiked={likedPostIds.includes(item.id)} />
      ))}
    </section>
  );
}

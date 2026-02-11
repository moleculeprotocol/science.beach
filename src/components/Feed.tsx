import FeedCard, { type FeedCardProps } from "./FeedCard";

type FeedProps = {
  items: FeedCardProps[];
};

export default function Feed({ items }: FeedProps) {
  return (
    <section className="w-full max-w-[476px] flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="px-4 py-3">
        <h5 className="h8 text-dark-space">Hypotheses Made</h5>
      </div>

      {/* Feed cards */}
      {items.map((item, i) => (
        <FeedCard key={i} {...item} />
      ))}
    </section>
  );
}

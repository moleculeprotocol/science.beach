import FeedCard, { type FeedCardProps } from "./FeedCard";

type FeedProps = {
  items: FeedCardProps[];
};

export default function Feed({ items }: FeedProps) {
  return (
    <section className="w-full max-w-[476px] flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="rounded-[2px] border-2 border-sand-4 bg-sand-2 px-4 py-3">
        <h5
          className="text-[9px] leading-[1.4] tracking-[-0.48px] text-sand-6"
          style={{ fontFamily: "var(--font-ibm-bios)", textShadow: "0px -1px 0px var(--smoke-5), 0px 1px 0px var(--smoke-7)" }}
        >
          Hypotheses Made
        </h5>
      </div>

      {/* Feed cards */}
      {items.map((item, i) => (
        <FeedCard key={i} {...item} />
      ))}
    </section>
  );
}

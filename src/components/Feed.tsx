import FeedCard, { type FeedCardProps } from "./FeedCard";

type FeedProps = {
  items: FeedCardProps[];
};

export default function Feed({ items }: FeedProps) {
  return (
    <section className="w-full max-w-[716px] bg-sand-3 flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="border-r-2 border-b-2 border-sand-4 bg-sand-2 px-4 py-3">
        <p
          className="text-[12px] font-normal leading-[1.4] tracking-[-0.48px] text-sand-6"
          style={{
            textShadow:
              "0px -1px 0px var(--smoke-5), 0px 1px 0px var(--smoke-7)",
            fontFamily: "var(--font-ibm-bios)",
          }}
        >
          Hypotheses Made
        </p>
      </div>

      {/* Feed cards */}
      {items.map((item, i) => (
        <FeedCard key={i} {...item} />
      ))}
    </section>
  );
}

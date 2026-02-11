export type ChatBalloonProps = {
  text: string;
  variant?: "default" | "short";
};

export default function ChatBalloon({ text, variant = "default" }: ChatBalloonProps) {
  const isShort = variant === "short";

  return (
    <div
      className="flex flex-col items-start"
      style={{ animation: "bubble-appear 0.4s ease-out, bubble-float 4s ease-in-out 0.4s infinite" }}
    >
      {/* Bubble box */}
      <div
        className={`bg-sand-1 border-b-2 border-r-2 border-sand-5 font-bold leading-[1.4] text-sand-8 ${
          isShort ? "px-3 py-2 text-center text-[13px]" : "w-[220px] p-2.5 text-[11px]"
        }`}
        style={{
          textShadow: "0.5px 0.5px 0px #fffefe, -0.5px -0.5px 0px #c2b4a9",
        }}
      >
        {text}
      </div>

      {/* Pixel-art tail (10x6px, pointing down-left) */}
      <div className="relative h-[6px] w-[10px]">
        {/* Row 1: sand-3 at 0,0 then sand-5 at 2-8,0 */}
        <div className="absolute left-0 top-0 size-[2px] bg-sand-3" />
        <div className="absolute left-[2px] top-0 size-[2px] bg-sand-5" />
        <div className="absolute left-[4px] top-0 size-[2px] bg-sand-5" />
        <div className="absolute left-[6px] top-0 size-[2px] bg-sand-5" />
        <div className="absolute left-[8px] top-0 size-[2px] bg-sand-5" />
        {/* Row 2: sand-3 at 0-6,2 */}
        <div className="absolute left-0 top-[2px] size-[2px] bg-sand-3" />
        <div className="absolute left-[2px] top-[2px] size-[2px] bg-sand-3" />
        <div className="absolute left-[4px] top-[2px] size-[2px] bg-sand-3" />
        <div className="absolute left-[6px] top-[2px] size-[2px] bg-sand-3" />
        {/* Row 3: sand-3 at 0,4 */}
        <div className="absolute left-0 top-[4px] size-[2px] bg-sand-3" />
      </div>
    </div>
  );
}

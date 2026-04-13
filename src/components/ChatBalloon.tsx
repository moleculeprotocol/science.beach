export type ChatBalloonProps = {
  text: string;
  variant?: "default" | "short";
  tailSide?: "left" | "right";
};

export default function ChatBalloon({
  text,
  variant = "default",
  tailSide = "left",
}: ChatBalloonProps) {
  const isShort = variant === "short";

  return (
    <div className="[animation:bubble-appear_0.4s_ease-out,bubble-float_4s_ease-in-out_0.4s_infinite] flex flex-col items-start">
      {/* Bubble box */}
      <div
        className={`text-shadow-bubble bg-day-1 border-b-2 border-r-2 border-day-4 font-bold leading-[1.4] text-day-11 ${
          isShort ? "px-3 py-2 text-center text-[13px] xl:text-[14px]" : "w-[220px] xl:w-[240px] p-2.5 text-[11px] xl:text-[12px]"
        }`}
      >
        {text}
      </div>

      {/* Pixel-art tail (10x6px, pointing down-left) */}
      <div className={`relative h-[6px] w-[10px] ${tailSide === "right" ? "[transform:scaleX(-1)]" : ""}`}>
        {/* Row 1: sand-3 at 0,0 then sand-5 at 2-8,0 */}
        <div className="absolute left-0 top-0 size-[2px] bg-day-3" />
        <div className="absolute left-[2px] top-0 size-[2px] bg-day-6" />
        <div className="absolute left-[4px] top-0 size-[2px] bg-day-6" />
        <div className="absolute left-[6px] top-0 size-[2px] bg-day-6" />
        <div className="absolute left-[8px] top-0 size-[2px] bg-day-6" />
        {/* Row 2: sand-3 at 0-6,2 */}
        <div className="absolute left-0 top-[2px] size-[2px] bg-day-3" />
        <div className="absolute left-[2px] top-[2px] size-[2px] bg-day-3" />
        <div className="absolute left-[4px] top-[2px] size-[2px] bg-day-3" />
        <div className="absolute left-[6px] top-[2px] size-[2px] bg-day-3" />
        {/* Row 3: sand-3 at 0,4 */}
        <div className="absolute left-0 top-[4px] size-[2px] bg-day-3" />
      </div>
    </div>
  );
}

type ProfileTypeTagProps = {
  kind: "agent" | "human";
  className?: string;
};

export default function ProfileTypeTag({
  kind,
  className = "",
}: ProfileTypeTagProps) {
  const isAgent = kind === "agent";

  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center justify-center border px-1.5 py-1 text-[12px] font-bold leading-[0.9] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.25)] ${
        isAgent
          ? "border-[#ff0700] bg-[#fff6f5] text-[#ff0700] [text-shadow:0px_-1px_0px_#ffb4b1,0px_1px_0px_#ffb4b1]"
          : "border-blue-4 bg-[#d5ebff] text-blue-3 [text-shadow:0px_-1px_0px_#a9cff3,0px_1px_0px_var(--light-space)]"
      } ${className}`}
    >
      {isAgent ? "Agent" : "Human"}
    </span>
  );
}

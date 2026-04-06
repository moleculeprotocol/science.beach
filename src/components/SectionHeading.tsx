import type { ReactNode } from "react";

export default function SectionHeading({
  children,
  className = "",
  variant = "sand",
  size = "sm",
}: {
  children: ReactNode;
  className?: string;
  variant?: "sand" | "white";
  size?: "sm" | "lg";
}) {
  const bgStyles =
    variant === "white"
      ? "border border-dawn-2 bg-white rounded-section"
      : "border border-dawn-2 bg-dawn-2 rounded-section";

  const textStyles =
    size === "lg"
      ? "font-bold text-[24px] leading-[1.4] text-dark-space"
      : "label-m-bold text-smoke-5";

  const Tag = size === "lg" ? "div" : "p";

  return (
    <div className={`${bgStyles} px-4 py-3 ${className}`}>
      <Tag className={textStyles}>
        {children}
      </Tag>
    </div>
  );
}

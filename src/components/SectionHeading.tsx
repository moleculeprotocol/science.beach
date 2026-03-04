import type { ReactNode } from "react";

export default function SectionHeading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-2 border-sand-7 bg-sand-3 px-4 py-3 ${className}`}>
      <p className="font-ibm-bios text-[12px] leading-[1.4] tracking-[-0.48px] text-sand-6 text-shadow-section-heading">
        {children}
      </p>
    </div>
  );
}

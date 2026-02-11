import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  compact?: boolean;
  className?: string;
};

export default function Card({
  children,
  compact,
  className = "",
}: CardProps) {
  return (
    <div
      className={`border border-smoke-5 bg-smoke-7 ${
        compact ? "p-4 flex flex-col gap-3" : "p-6 flex flex-col gap-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

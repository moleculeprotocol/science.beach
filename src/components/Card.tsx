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
      className={`border border-dawn-2 bg-white rounded-panel ${
        compact ? "p-4 flex flex-col gap-3" : "p-6 flex flex-col gap-6"
      } ${className}`}
    >
      {children}
    </div>
  );
}

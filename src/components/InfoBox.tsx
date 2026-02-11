import { type ReactNode } from "react";

type InfoBoxProps = {
  children: ReactNode;
  variant?: "default" | "warning";
};

export default function InfoBox({ children, variant = "default" }: InfoBoxProps) {
  return (
    <div
      className={`bg-smoke-6 p-3 flex flex-col gap-2 ${
        variant === "warning"
          ? "border-2 border-orange-1"
          : "border border-smoke-5"
      }`}
    >
      {children}
    </div>
  );
}

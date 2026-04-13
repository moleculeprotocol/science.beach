import { type ReactNode } from "react";

/**
 * Standard container panel matching V2 Figma design specs.
 *
 * "sand"  — rounded card: bg-white, border border-dawn-2, rounded-panel
 * "smoke" — same style (converged in V2)
 */

export type PanelProps = {
  children: ReactNode;
  variant?: "sand" | "smoke";
  compact?: boolean;
  as?: "div" | "section" | "article";
  className?: string;
};

const styles = {
  sand: "bg-white border border-dawn-2 rounded-panel",
  smoke: "bg-smoke-7 border border-smoke-3 rounded-panel",
} as const;

export default function Panel({
  children,
  variant = "sand",
  compact = false,
  as: Tag = "div",
  className = "",
}: PanelProps) {
  const spacing = compact ? "p-3 gap-2" : "p-4 gap-4";

  return (
    <Tag className={`flex flex-col ${spacing} ${styles[variant]} ${className}`}>
      {children}
    </Tag>
  );
}

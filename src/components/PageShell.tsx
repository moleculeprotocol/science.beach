import { type ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

export default function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <main className={`flex justify-center pt-80 pb-12 ${className}`}>
      {children}
    </main>
  );
}

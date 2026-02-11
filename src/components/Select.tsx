import { type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`border border-smoke-5 bg-smoke-6 px-3 py-2 mono-s text-dark-space focus:outline-none focus:border-blue-4 ${className}`}
      {...props}
    />
  );
}

import { type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ className = "", ...props }: SelectProps) {
  return (
    <select
      className={`border border-dawn-3 bg-white rounded-sm px-3 py-2 paragraph-s text-dark-space focus:outline-none focus:border-blue-4 ${className}`}
      {...props}
    />
  );
}

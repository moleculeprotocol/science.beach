import { type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({ className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`border border-dawn-2 bg-white rounded-[12px] px-4 py-2.5 paragraph-s text-dark-space placeholder:text-smoke-4 focus:outline-none focus:border-blue-4 transition-colors ${className}`}
      {...props}
    />
  );
}

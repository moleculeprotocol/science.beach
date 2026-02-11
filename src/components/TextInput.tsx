import { type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export default function TextInput({ className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`border border-smoke-5 bg-smoke-6 px-3 py-2 mono-s text-dark-space focus:outline-none focus:border-blue-4 ${className}`}
      {...props}
    />
  );
}

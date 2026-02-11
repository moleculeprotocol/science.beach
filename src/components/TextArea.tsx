import { type TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  compact?: boolean;
};

export default function TextArea({
  compact,
  className = "",
  ...props
}: TextAreaProps) {
  return (
    <textarea
      className={`border border-smoke-5 bg-smoke-6 mono-s text-dark-space focus:outline-none focus:border-blue-4 resize-y ${
        compact ? "px-2 py-1.5 text-xs" : "px-3 py-2"
      } ${className}`}
      {...props}
    />
  );
}

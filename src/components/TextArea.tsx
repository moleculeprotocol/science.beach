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
      className={`border border-dawn-2 bg-white rounded-section paragraph-s text-dark-space placeholder:text-smoke-4 focus:outline-none focus:border-blue-4 transition-colors resize-y ${
        compact ? "px-2 py-1.5 text-xs" : "px-4 py-2.5"
      } ${className}`}
      {...props}
    />
  );
}

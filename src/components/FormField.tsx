import { type ReactNode } from "react";

type FormFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export default function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-s-bold text-dark-space">
        {label}
        {hint && (
          <span className="label-s-regular text-smoke-5"> {hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}

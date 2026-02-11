"use client";

import { useState } from "react";

type CodeBlockProps = {
  children: string;
  copyable?: boolean;
  multiline?: boolean;
};

export default function CodeBlock({
  children,
  copyable,
  multiline,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (multiline) {
    return (
      <pre className="mono-s text-smoke-2 whitespace-pre-wrap text-xs">
        {children}
      </pre>
    );
  }

  return (
    <div className="flex gap-2">
      <code className="flex-1 border border-smoke-5 bg-smoke-6 px-3 py-2 mono-s text-dark-space break-all">
        {children}
      </code>
      {copyable && (
        <button
          onClick={copy}
          className="border border-smoke-5 px-3 py-2 label-s-bold text-smoke-2 hover:bg-smoke-6 transition-colors shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

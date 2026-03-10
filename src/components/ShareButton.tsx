"use client";

import { useState } from "react";
import Icon from "./Icon";
import { trackPostShared } from "@/lib/tracking-client";

type ShareButtonProps = {
  path: string;
  label?: string;
};

export default function ShareButton({ path, label }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}${path}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackPostShared({ post_id: path.split("/").pop() ?? path, path });
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 label-s-regular text-smoke-5 hover:text-blue-4 transition-colors"
    >
      <Icon name="share" color="currentColor" />
      {copied ? "Link copied" : label ?? "Share"}
    </button>
  );
}

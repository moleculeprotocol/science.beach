"use client";

import { useState } from "react";
import Icon from "./Icon";
import type { PostWithProfile, CommentWithProfile } from "@/lib/postDetails";

type Props = {
  post: PostWithProfile;
  comments: CommentWithProfile[];
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function postToMarkdown(post: PostWithProfile, comments: CommentWithProfile[]): string {
  const date = post.created_at.slice(0, 10);
  const author = post.profiles.handle;

  const lines: string[] = [
    `# ${post.title}`,
    "",
    `**Author:** ${author}  `,
    `**Posted:** ${date}`,
    "",
    "---",
    "",
    "## Hypothesis",
    "",
    post.body,
    "",
    "---",
    "",
    `## Discussion (${comments.length} comments)`,
    "",
  ];

  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const c of sorted) {
    const ts = c.created_at.replace("T", " ").replace(/\.\d+\+00:00$/, " UTC");
    lines.push(`### ${c.profiles.handle} — ${ts}`, "", c.body, "", "---", "");
  }

  return lines.join("\n");
}

export default function DownloadButton({ post, comments }: Props) {
  const [downloading, setDownloading] = useState(false);

  function handleDownload() {
    setDownloading(true);

    const markdown = postToMarkdown(post, comments);
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(post.title)}.md`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(false), 1000);
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 label-s-regular text-smoke-5 hover:text-blue-4 transition-colors"
    >
      <Icon name="download" color="currentColor" />
      {downloading ? "Downloading…" : "Download"}
    </button>
  );
}

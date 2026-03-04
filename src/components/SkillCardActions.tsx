"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type SkillCardActionsProps = {
  installCommand: string;
  docsHref: string;
  skillSlug: string;
};

export default function SkillCardActions({
  installCommand,
  docsHref,
  skillSlug,
}: SkillCardActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const actionClassName =
    "inline-flex size-6 items-center justify-center border border-smoke-5 bg-smoke-7 text-sand-6 transition-colors hover:bg-smoke-6 hover:text-smoke-2";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        className={actionClassName}
        aria-label={`Copy install command for ${skillSlug}`}
        title={copied ? "Copied" : "Copy install command"}
      >
        {copied ? (
          <Image
            src="/icons/verified.svg"
            alt=""
            width={14}
            height={14}
            unoptimized
          />
        ) : (
          <Image
            src="/icons/copy.svg"
            alt=""
            width={14}
            height={14}
            unoptimized
          />
        )}
      </button>
      <Link
        href={docsHref}
        className={actionClassName}
        aria-label={`Open docs for ${skillSlug}`}
        title="Open skill docs"
      >
        <Image
          src="/icons/book-open.svg"
          alt=""
          width={14}
          height={14}
          unoptimized
        />
      </Link>
    </div>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import CoveSelect, { type CoveOption } from "@/components/CoveSelect";
import { updatePostCove } from "./cove-actions";

type PostCoveEditorProps = {
  postId: string;
  currentCoveId: string | null;
  currentCoveName: string | null;
  currentCoveSlug: string | null;
  coves: CoveOption[];
  isAuthor: boolean;
};

export default function PostCoveEditor({
  postId,
  currentCoveId,
  currentCoveName,
  currentCoveSlug,
  coves,
  isAuthor,
}: PostCoveEditorProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coveName, setCoveName] = useState(currentCoveName);
  const [coveSlug, setCoveSlug] = useState(currentCoveSlug);
  const [selectedCoveId, setSelectedCoveId] = useState(currentCoveId ?? "");

  async function handleSave(coveId: string) {
    setSaving(true);
    try {
      const result = await updatePostCove(postId, coveId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const selected = coves.find((c) => c.id === coveId);
      setCoveName(selected?.name ?? null);
      setCoveSlug(selected?.slug ?? null);
      setSelectedCoveId(coveId);
      setEditing(false);
      toast.success("Cove updated");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {coveName && coveSlug ? (
        <Link
          href={`/cove/${coveSlug}`}
          className="label-s-regular text-blue-4 hover:underline"
        >
          {coveName}
        </Link>
      ) : (
        <span className="label-s-regular text-smoke-5">No cove assigned</span>
      )}

      {isAuthor && !editing && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="label-s-regular text-smoke-5 hover:text-dark-space transition-colors"
        >
          Change
        </button>
      )}

      {isAuthor && editing && (
        <div className="w-full mt-1">
          <CoveSelect
            coves={coves}
            value={selectedCoveId}
            onChange={(id) => handleSave(id)}
          />
          {saving && (
            <p className="label-s-regular text-smoke-5 mt-1">Saving...</p>
          )}
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="label-s-regular text-smoke-5 hover:text-dark-space mt-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

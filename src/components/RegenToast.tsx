"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  adminRegenPrepare,
  adminRegenCraftPrompt,
  adminRegenGenerateImage,
  adminRegenFinalize,
  adminRegenMarkFailed,
} from "@/app/admin/actions";

export type RegenStep =
  | "preparing"
  | "crafting"
  | "generating"
  | "storing"
  | "done"
  | "error";

const STEPS: { id: RegenStep; label: string }[] = [
  { id: "preparing", label: "Preparing" },
  { id: "crafting", label: "Crafting prompt" },
  { id: "generating", label: "Generating image" },
  { id: "storing", label: "Storing versions" },
];

const STEP_IDS = STEPS.map((s) => s.id);

export function useRegenerate(postId: string) {
  const [step, setStep] = useState<RegenStep | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const regenerate = useCallback(async () => {
    setError(null);

    try {
      setStep("preparing");
      await adminRegenPrepare(postId);

      setStep("crafting");
      const { prompt, caption } = await adminRegenCraftPrompt(postId);

      setStep("generating");
      await adminRegenGenerateImage(postId, prompt);

      setStep("storing");
      await adminRegenFinalize(postId, caption);

      setStep("done");
      router.refresh();
      setTimeout(() => setStep(null), 2500);
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Generation failed");
      try {
        await adminRegenMarkFailed(postId);
        router.refresh();
      } catch {}
    }
  }, [postId, router]);

  const dismiss = useCallback(() => setStep(null), []);

  return {
    step,
    error,
    regenerate,
    dismiss,
    isActive: step !== null,
    isPending: step !== null && step !== "done" && step !== "error",
  };
}

function StepIndicator({ status }: { status: "done" | "active" | "pending" }) {
  if (status === "done") {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 text-green-2 label-s-bold">
        +
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center justify-center w-4 h-4 text-blue-4 animate-pulse label-s-bold">
        ~
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 text-smoke-5 label-s-bold">
      -
    </span>
  );
}

export default function RegenToast({
  step,
  error,
  onDismiss,
}: {
  step: RegenStep | null;
  error: string | null;
  onDismiss?: () => void;
}) {
  if (!step) return null;

  const currentIndex =
    step === "done"
      ? STEPS.length
      : step === "error"
        ? -1
        : STEP_IDS.indexOf(step);

  return (
    <div className="fixed bottom-4 right-4 z-[10000] w-64 border-2 border-smoke-5 bg-dark-space p-3 shadow-[4px_4px_0_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-2">
        <p className="label-s-bold text-sand-3">
          {step === "done"
            ? "Complete!"
            : step === "error"
              ? "Failed"
              : "Regenerating"}
        </p>
        {(step === "done" || step === "error") && onDismiss && (
          <button
            onClick={onDismiss}
            className="label-s-bold text-smoke-5 hover:text-sand-3 transition-colors"
          >
            x
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {STEPS.map((s, i) => {
          let status: "done" | "active" | "pending";
          if (step === "done" || i < currentIndex) {
            status = "done";
          } else if (i === currentIndex) {
            status = "active";
          } else {
            status = "pending";
          }

          return (
            <div key={s.id} className="flex items-center gap-1.5">
              <StepIndicator status={status} />
              <span
                className={`label-s-regular ${
                  status === "done"
                    ? "text-green-2"
                    : status === "active"
                      ? "text-sand-3"
                      : "text-smoke-5"
                }`}
              >
                {s.label}
                {status === "active" && "..."}
              </span>
            </div>
          );
        })}
      </div>

      {step === "error" && error && (
        <p className="label-s-regular text-orange-1 mt-2 break-words">
          {error}
        </p>
      )}
    </div>
  );
}

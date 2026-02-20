"use client";

import { useState, useCallback, useEffect, useRef, useTransition } from "react";
import Image from "next/image";
import { adminDeleteInfographic } from "@/app/admin/actions";
import RegenToast, { useRegenerate } from "@/components/RegenToast";

type InfographicImageProps = {
  src: string;
  alt: string;
  caption?: string | null;
  variant?: "feed" | "full";
  postId?: string;
  isAdmin?: boolean;
};

function toThumbUrl(src: string): string {
  return src.replace(/\.(png|webp)(\?.*)?$/, "_thumb.webp$2");
}

export default function InfographicImage({
  src,
  alt,
  caption,
  variant = "full",
  postId,
  isAdmin,
}: InfographicImageProps) {
  const [expanded, setExpanded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [fullReady, setFullReady] = useState(variant === "full");
  const [deletePending, startDeleteTransition] = useTransition();
  const regen = useRegenerate(postId ?? "");
  const preloaded = useRef(false);

  const close = useCallback(() => setExpanded(false), []);

  const anyPending = deletePending || regen.isPending;

  // Preload full-res in the background once the thumbnail is visible
  useEffect(() => {
    if (variant !== "feed" || preloaded.current) return;
    preloaded.current = true;
    const img = new globalThis.Image();
    img.src = src;
    img.onload = () => setFullReady(true);
  }, [variant, src]);

  useEffect(() => {
    if (!expanded) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [expanded, close]);

  // Feed variant tries thumbnail first; falls back to full-res on 404
  const inlineSrc = variant === "feed" && !thumbFailed ? toThumbUrl(src) : src;

  const showAdmin = isAdmin && postId;

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="relative group">
          <button
            type="button"
            onClick={() => !regen.isPending && setExpanded(true)}
            className={`relative w-full border-2 overflow-hidden transition-colors duration-300 ${
              regen.isPending
                ? "border-blue-4 cursor-default"
                : "border-sand-4 cursor-zoom-in"
            }`}
          >
            <Image
              src={inlineSrc}
              alt={alt}
              width={1024}
              height={1024}
              unoptimized
              className={`w-full h-auto transition-all duration-500 ${
                regen.isPending ? "grayscale opacity-40 scale-[1.01]" : ""
              }`}
              style={{ imageRendering: "pixelated" }}
              loading="lazy"
              onError={
                variant === "feed" && !thumbFailed
                  ? () => setThumbFailed(true)
                  : undefined
              }
            />
            {regen.isPending && (
              <>
                <style>{`@keyframes regen-scan{0%,100%{top:-2px}50%{top:calc(100% - 2px)}}`}</style>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-dark-space/30" />
                  <div
                    className="absolute left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-blue-4 to-transparent"
                    style={{
                      animation: "regen-scan 2s ease-in-out infinite",
                      boxShadow: "0 0 12px var(--blue-4), 0 0 4px var(--blue-4)",
                    }}
                  />
                </div>
              </>
            )}
          </button>
          {showAdmin && (
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                disabled={anyPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!confirm("Regenerate the infographic? This will replace the current one.")) return;
                  regen.regenerate();
                }}
                className={`label-s-bold px-3 py-1.5 bg-light-space text-blue-4 border-2 border-blue-4 hover:bg-blue-4 hover:text-light-space transition-colors shadow-[2px_2px_0_rgba(0,0,0,0.3)] ${anyPending ? "opacity-50" : ""}`}
              >
                Regen
              </button>
              <button
                disabled={anyPending}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!confirm("Delete the infographic for this post?")) return;
                  startDeleteTransition(() => adminDeleteInfographic(postId));
                }}
                className={`label-s-bold px-3 py-1.5 bg-light-space text-orange-1 border-2 border-orange-1 hover:bg-orange-1 hover:text-light-space transition-colors shadow-[2px_2px_0_rgba(0,0,0,0.3)] ${anyPending ? "opacity-50" : ""}`}
              >
                {deletePending ? "..." : "Delete"}
              </button>
            </div>
          )}
        </div>
        {caption && (
          <p className="label-s-regular text-smoke-5">{caption}</p>
        )}
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-space/80 cursor-zoom-out"
          onClick={close}
        >
          <div className="relative w-[95vw] max-w-[1400px] max-h-[90vh] flex flex-col gap-2">
            {!fullReady && (
              <div className="w-full aspect-video flex items-center justify-center">
                <span className="label-s-regular text-sand-3 animate-pulse">
                  Loading full resolution...
                </span>
              </div>
            )}
            <Image
              src={src}
              alt={alt}
              width={2048}
              height={2048}
              unoptimized
              className={`w-full h-auto max-h-[85vh] object-contain transition-opacity duration-200 ${
                fullReady ? "opacity-100" : "opacity-0 absolute"
              }`}
              style={{ imageRendering: "pixelated" }}
              onLoad={() => setFullReady(true)}
            />
            {caption && (
              <p className="label-s-regular text-sand-3 text-center">{caption}</p>
            )}
          </div>
        </div>
      )}

      <RegenToast step={regen.step} error={regen.error} onDismiss={regen.dismiss} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Top-right widget showing remaining OpenRouter credits.
 * Fetches /api/openrouter/credits on mount and every ~60s. Renders nothing
 * while loading or when credits are unavailable (missing key / upstream error),
 * so it never shows a broken state.
 */
export default function OpenRouterCreditsBadge() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/openrouter/credits");
        if (!res.ok) return;
        const data = (await res.json()) as { remaining?: number; available?: false };
        if (active && typeof data.remaining === "number") {
          setRemaining(data.remaining);
        }
      } catch {
        // Keep last rendered value; never surface an error in the navbar.
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (remaining === null) return null;

  return (
    <div
      className="hidden sm:flex h-[36px] items-center gap-2 px-3.5 rounded-full bg-smoke-7 border border-smoke-3"
      title="OpenRouter credits remaining"
    >
      <span className="label-s-bold text-smoke-4 uppercase tracking-wide">Credits</span>
      <span className="mono-s font-bold text-dark-space">{currency.format(remaining)}</span>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

type Props = {
  event: string;
  properties: Record<string, unknown>;
};

export default function TrackPageView({ event, properties }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    posthog.capture(event, properties);
  }, [event, properties]);

  return null;
}

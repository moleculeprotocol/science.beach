"use client";

import { useEffect } from "react";
import { useUser } from "@/lib/hooks/useUser";
import posthog from "posthog-js";

export default function PostHogIdentify() {
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, { email: user.email });
    } else {
      posthog.reset();
    }
  }, [user]);

  return null;
}

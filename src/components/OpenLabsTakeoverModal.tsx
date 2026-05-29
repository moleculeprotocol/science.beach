"use client";

import { useEffect } from "react";

export default function OpenLabsTakeoverModal() {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-space/60 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="openlabs-takeover-title"
    >
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-panel border border-dawn-3 bg-white p-6 sm:p-8">
        <h2 id="openlabs-takeover-title" className="h4 text-dark-space">
          Please continue your scientific discoveries on OpenLabs.
        </h2>

        <p className="paragraph-m mt-4 text-dawn-9">
          Science Beach has moved to OpenLabs. Your discoveries have been
          migrated, and you can continue after onboarding.
        </p>

        <a
          href="https://openlabs.bio.xyz/"
          className="mt-6 flex h-8 items-center justify-center rounded-full bg-blue-4 px-5 label-s-bold text-sand-1 transition-opacity hover:opacity-90"
        >
          Continue to OpenLabs
        </a>
      </div>
    </div>
  );
}

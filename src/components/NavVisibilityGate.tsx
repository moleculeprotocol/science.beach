"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavVisibilityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isDocsPage = pathname === "/docs" || pathname.startsWith("/docs/");
  const isCovesPage = pathname === "/coves";
  const isCoveDetailPage = pathname.startsWith("/cove/");
  const isPostDetailPage = pathname.startsWith("/post/") && pathname !== "/post/new";
  const isProfileDetailPage = /^\/profile\/[^/]+$/.test(pathname);
  const showOverlayNavbar =
    pathname === "/" ||
    isDocsPage ||
    isCovesPage ||
    isCoveDetailPage ||
    isPostDetailPage ||
    isProfileDetailPage;

  useEffect(() => {
    document.body.classList.toggle("home-page", pathname === "/");
  }, [pathname]);

  return (
    <div data-nav-overlay={showOverlayNavbar ? "true" : undefined}>
      {children}
    </div>
  );
}

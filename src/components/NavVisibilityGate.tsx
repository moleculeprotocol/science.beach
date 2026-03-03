"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PATH_PREFIXES = ["/docs"];
const PROFILE_PATH_PREFIX = "/profile/";

export default function NavVisibilityGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideNavbar = HIDDEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isProfilePage = pathname.startsWith(PROFILE_PATH_PREFIX);

  if (hideNavbar) {
    return null;
  }

  return <div className={isProfilePage ? "profile-nav" : undefined}>{children}</div>;
}

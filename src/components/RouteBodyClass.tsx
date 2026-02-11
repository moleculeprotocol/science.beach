"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HOME_BODY_CLASS = "home-page";

export default function RouteBodyClass() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      document.body.classList.add(HOME_BODY_CLASS);
    } else {
      document.body.classList.remove(HOME_BODY_CLASS);
    }

    return () => {
      document.body.classList.remove(HOME_BODY_CLASS);
    };
  }, [pathname]);

  return null;
}

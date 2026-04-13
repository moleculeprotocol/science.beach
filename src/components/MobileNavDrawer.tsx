"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/coves", label: "Coves" },
  { href: "/docs", label: "API Docs" },
];

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative xl:hidden" ref={drawerRef}>
      {/* Hamburger icon button — beige/sand bg matching Figma */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-day-4 hover:bg-day-3 transition-colors"
        aria-label="Open navigation"
        aria-expanded={open}
      >
        {open ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <Image
            src="/icons/dropdown-menu.svg"
            alt=""
            aria-hidden
            width={24}
            height={24}
            className=""
          />
        )}
      </button>

      {/* Dropdown nav */}
      {open && (
        <div className="absolute right-0 top-[52px] z-50 min-w-[180px] rounded-panel bg-white border border-dawn-2 shadow-sm py-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center px-4 py-3 paragraph-s text-smoke-4 hover:text-dark-space hover:bg-dawn-1 transition-colors"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CRAB_BG_CLASS } from "./crabColors";
import { normalizeColorName } from "@/lib/recolorCrab";

type UserMenuProps = {
  displayName: string;
  handle: string;
  avatarBg?: string | null;
};

export default function UserMenu({ displayName, handle, avatarBg }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={menuRef} className="relative flex h-9 items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-sm ${CRAB_BG_CLASS[normalizeColorName(avatarBg)]}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Image
          src="/animated/crab/crab-0.svg"
          alt={displayName}
          width={60}
          height={60}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ imageRendering: "pixelated" }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-[208px] flex-col gap-1 rounded-input border border-dawn-2 bg-white p-3 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)]">
          <Link
            href={`/profile/${handle}`}
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-dark-space hover:bg-dawn-2 rounded-sm"
          >
            My Profile
          </Link>
          <Link
            href="/profile/edit"
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-dark-space hover:bg-dawn-2 rounded-sm"
          >
            Settings
          </Link>
          <Link
            href="/login?mode=agent"
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-dark-space hover:bg-dawn-2 rounded-sm"
          >
            Register Agent
          </Link>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex h-8 w-full items-center px-3 label-m-bold bg-red-1 text-red-4 hover:opacity-90 rounded-sm"
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

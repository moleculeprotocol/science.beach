"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type UserMenuProps = {
  displayName: string;
  handle: string;
};

export default function UserMenu({ displayName, handle }: UserMenuProps) {
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
        className="relative h-8 w-8 shrink-0 overflow-hidden shadow-[0px_4px_0px_0px_var(--smoke-5)] active:translate-y-[2px] bg-yellow-4"
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
        <div className="absolute right-0 top-full z-50 mt-1 flex w-[208px] flex-col gap-1 rounded-[2px] border-2 border-sand-4 bg-sand-2 p-3">
          <Link
            href={`/profile/${handle}`}
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-sand-6 hover:bg-sand-3"
          >
            My Profile
          </Link>
          <Link
            href="/profile/edit"
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-sand-6 hover:bg-sand-3"
          >
            Settings
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="flex h-8 items-center px-3 label-m-bold text-sand-6 hover:bg-sand-3"
          >
            Register Agent
          </Link>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="flex h-8 w-full items-center px-3 label-m-bold bg-red-6 text-red-4 hover:opacity-90"
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

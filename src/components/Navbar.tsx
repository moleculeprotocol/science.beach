import Image from "next/image";
import Link from "next/link";
import UserMenu from "./UserMenu";
import { createClient } from "@/lib/supabase/server";

export type NavbarProps = { width?: "feed" | "full" };

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/coves", label: "Coves" },
  { href: "/docs", label: "API Docs" },
];

export default async function Navbar({ width = "feed" }: NavbarProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { handle: string; display_name: string; is_admin: boolean; avatar_bg: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("handle, display_name, is_admin, avatar_bg")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="relative flex h-[74px] w-full items-center justify-between px-6 py-3">
      {/* Left: Logo + Nav links */}
      <div className="flex items-center gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/crab.svg"
            alt="Science Beach"
            width={32}
            height={24}
            className="shrink-0 brightness-0"
            style={{ imageRendering: "pixelated" }}
            priority
          />
          <span className="hidden sm:block text-[16px] font-bold leading-[1.4] text-dark-space">
            Science Beach
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1 ml-12">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="paragraph-s text-smoke-4 hover:text-dark-space px-3 py-1.5 rounded-full hover:bg-dawn-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Auth buttons */}
      <div className="flex items-center gap-2">
        {profile ? (
          <>
            {profile.is_admin && (
              <Link
                href="/admin"
                className="hidden sm:flex h-[36px] items-center px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
              >
                Admin
              </Link>
            )}
            <Link
              href="/post/new"
              className="hidden sm:flex h-[36px] items-center px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
            >
              New Hypothesis
            </Link>
            <UserMenu displayName={profile.display_name} handle={profile.handle} avatarBg={profile.avatar_bg} />
          </>
        ) : (
          <>
            <Link
              href="/login?mode=human"
              className="flex h-[36px] items-center px-4 rounded-full border border-dawn-3 text-dark-space text-[14px] font-bold hover:bg-dawn-2 transition-colors"
            >
              I&apos;m a Human
            </Link>
            <Link
              href="/login?mode=agent"
              className="flex h-[36px] items-center gap-1.5 px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
            >
              <span className="text-[18px] leading-none">+</span>
              Register as Agent
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

import Image from "next/image";
import Link from "next/link";
import UserMenu from "./UserMenu";
import MobileNavDrawer from "./MobileNavDrawer";
import NavCoveLabel from "./NavCoveLabel";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/", label: "Feed" },
  { href: "/coves", label: "Coves" },
  { href: "/docs", label: "API Docs" },
];

export default async function Navbar() {
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
    <nav className="relative flex h-[74px] md:h-[88px] lg:h-[74px] w-full items-center justify-between px-6 py-3 md:py-5 lg:py-3">
      {/* Left: Logo + Nav links (desktop only) */}
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

        {/* Desktop nav links — hidden on tablet/mobile */}
        <div className="hidden xl:flex items-center gap-1 ml-12">
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

      {/* Right: Context label + nav drawer + auth */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Active cove label — tablet only, disappears on desktop where nav links are visible */}
        <NavCoveLabel />

        {/* Mobile/tablet hamburger — hidden on desktop */}
        <MobileNavDrawer />

        {profile ? (
          <>
            {profile.is_admin && (
              <Link
                href="/admin"
                className="hidden xl:flex h-[36px] items-center px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
              >
                Admin
              </Link>
            )}
            {/* Tablet/mobile: "+" circle */}
            <Link
              href="/post/new"
              className="flex xl:hidden h-[50px] w-[50px] items-center justify-center rounded-full bg-dark-space text-light-space text-[22px] font-bold hover:opacity-90 transition-opacity"
              aria-label="New Hypothesis"
            >
              +
            </Link>
            {/* Desktop: full label */}
            <Link
              href="/post/new"
              className="hidden xl:flex h-[36px] items-center px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
            >
              New Hypothesis
            </Link>
            <UserMenu displayName={profile.display_name} handle={profile.handle} avatarBg={profile.avatar_bg} />
          </>
        ) : (
          <>
            {/* Desktop: "I'm a Human" */}
            <Link
              href="/login?mode=human"
              className="hidden xl:flex h-[36px] items-center px-4 rounded-full border border-dawn-3 text-dark-space text-[14px] font-bold hover:bg-dawn-2 transition-colors"
            >
              I&apos;m a Human
            </Link>
            {/* Tablet/mobile: "+" circle */}
            <Link
              href="/login?mode=agent"
              data-register-agent-cta="mobile"
              className="flex xl:hidden h-[50px] w-[50px] items-center justify-center rounded-full bg-dark-space text-light-space text-[22px] font-bold hover:opacity-90 transition-opacity"
              aria-label="Register as Agent"
            >
              +
            </Link>
            {/* Desktop: full label */}
            <Link
              href="/login?mode=agent"
              data-register-agent-cta="desktop"
              className="hidden xl:flex h-[36px] items-center gap-1.5 px-4 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
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

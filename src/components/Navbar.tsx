import Image from "next/image";
import Link from "next/link";
import PixelButton from "./PixelButton";
import UserMenu from "./UserMenu";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { handle: string; display_name: string; is_admin: boolean } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("handle, display_name, is_admin")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="relative flex h-auto min-h-[72px] w-full max-w-none items-center justify-between overflow-visible border-b-0 border-r-2 border-blue-5 bg-[#1271CB] px-3 py-2.5 sm:max-w-[716px] sm:border-b-2 sm:bg-blue-4 xl:min-h-[76px] xl:px-4">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/">
          <Image
            src="/assets/logo-small.svg"
            alt="Science Beach logo"
            width={50}
            height={32}
            className="shrink-0"
            priority
          />
        </Link>
        <Link href="/" className="hidden sm:block">
          <span className="text-shadow-nav-logo text-[20px] xl:text-[22px] font-bold leading-[1.4] text-light-space">
            Science Beach
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
        {profile ? (
          <>
            {profile.is_admin && (
              <Link href="/admin">
                <PixelButton
                  bg="orange-1"
                  textColor="light-space"
                  shadowColor="smoke-5"
                  textShadowTop="smoke-5"
                  textShadowBottom="smoke-7"
                >
                  Admin
                </PixelButton>
              </Link>
            )}
            <Link href="/post/new">
              <PixelButton
                bg="green-4"
                textColor="green-2"
                shadowColor="green-2"
                textShadowTop="green-3"
                textShadowBottom="green-5"
              >
                New Hypotheses
              </PixelButton>
            </Link>
            <UserMenu displayName={profile.display_name} handle={profile.handle} />
          </>
        ) : (
          <>
            <Link href="/login?mode=human">
              <PixelButton
                bg="smoke-6"
                textColor="orange-1"
                shadowColor="smoke-5"
                textShadowTop="smoke-5"
                textShadowBottom="smoke-7"
              >
                I&apos;m a Human
              </PixelButton>
            </Link>
            <Link href="/login?mode=agent">
              <PixelButton
                bg="green-4"
                textColor="green-2"
                shadowColor="green-2"
                textShadowTop="green-3"
                textShadowBottom="green-5"
              >
                I&apos;m an Agent
              </PixelButton>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

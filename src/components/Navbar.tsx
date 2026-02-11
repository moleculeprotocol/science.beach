import Image from "next/image";
import Link from "next/link";
import PixelButton from "./PixelButton";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { handle: string; display_name: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("handle, display_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <nav className="relative flex w-[716px] items-center justify-between overflow-visible border-b-2 border-r-2 border-blue-5 bg-blue-4 pr-3 py-4">
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/science-crab.svg"
            alt="Science Beach crab"
            width={64}
            height={64}
            className="-my-4 shrink-0"
            priority
          />
        </Link>
        <Link href="/">
          <span
            className="text-2xl font-bold text-light-space"
            style={{
              textShadow:
                "0px -1px 0px var(--dark-space), 0px 1px 0px var(--blue-2)",
            }}
          >
            Science Beach
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2.5">
        {profile ? (
          <>
            <Link href={`/profile/${profile.handle}`}>
              <span className="label-s-bold text-light-space">
                {profile.display_name}
              </span>
            </Link>
            <form action="/auth/signout" method="POST">
              <PixelButton
                type="submit"
                bg="smoke-6"
                textColor="orange-1"
                shadowColor="smoke-5"
                textShadowTop="smoke-5"
                textShadowBottom="smoke-7"
              >
                Sign Out
              </PixelButton>
            </form>
            <Link href="/post/new">
              <PixelButton
                bg="green-4"
                textColor="green-2"
                shadowColor="green-2"
                textShadowTop="green-3"
                textShadowBottom="green-5"
              >
                New Hypothesis
              </PixelButton>
            </Link>
          </>
        ) : (
          <>
            <Link href="/login">
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
            <Link href="/auth/register">
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

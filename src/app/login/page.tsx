import { signInWithGoogle } from "./actions";
import PixelButton from "@/components/PixelButton";
import Card from "@/components/Card";
import ErrorBanner from "@/components/ErrorBanner";
import PixelWave from "@/components/PixelWave";
import Image from "next/image";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center">
      <PixelWave />

      <div className="relative z-10 w-full max-w-[476px] px-4">
        <Card>
          <h5 className="h6 text-dark-space text-center">Welcome to Science Beach</h5>

          <p className="label-s-regular text-smoke-5 text-center">
            AI agent?{" "}
            <Link
              href="/auth/register"
              className="text-green-4 hover:underline"
            >
              Register here
            </Link>{" "}
            instead.
          </p>

          {error && <ErrorBanner message={error} />}

          <form action={signInWithGoogle} className="flex justify-center">
            <PixelButton
              type="submit"
              bg="blue-4"
              textColor="light-space"
              shadowColor="blue-2"
              textShadowTop="blue-2"
              textShadowBottom="blue-5"
            >
              <span className="flex items-center justify-center gap-2">
                <Image src="/icons/google.svg" alt="" width={16} height={16} />
                Continue with Google
              </span>
            </PixelButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { login, signup } from "./actions";
import PixelButton from "@/components/PixelButton";
import TextInput from "@/components/TextInput";
import FormField from "@/components/FormField";
import Card from "@/components/Card";
import PageShell from "@/components/PageShell";
import ErrorBanner from "@/components/ErrorBanner";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; mode?: string }>;
}) {
  const { error, mode } = await searchParams;
  const isSignUp = mode === "signup";

  return (
    <PageShell>
      <Card className="w-full max-w-[476px]">
        <p className="label-s-regular text-smoke-5 text-center">
          AI agent?{" "}
          <Link href="/auth/register" className="text-green-4 hover:underline">
            Register here
          </Link>{" "}
          instead.
        </p>

        {/* Mode tabs */}
        <div className="flex border-b border-smoke-5">
          <Link
            href="/login"
            className={`flex-1 text-center py-2 label-m-bold transition-colors ${
              !isSignUp
                ? "text-dark-space border-b-2 border-blue-4"
                : "text-smoke-5"
            }`}
          >
            Sign In
          </Link>
          <Link
            href="/login?mode=signup"
            className={`flex-1 text-center py-2 label-m-bold transition-colors ${
              isSignUp
                ? "text-dark-space border-b-2 border-green-4"
                : "text-smoke-5"
            }`}
          >
            Sign Up
          </Link>
        </div>

        {error && <ErrorBanner message={error} />}

        {isSignUp ? (
          <form className="flex flex-col gap-4" action={signup}>
            <FormField label="Email">
              <TextInput name="email" type="email" required />
            </FormField>
            <FormField label="Password">
              <TextInput name="password" type="password" required minLength={6} />
            </FormField>
            <FormField label="Handle">
              <TextInput name="handle" type="text" required placeholder="my-handle" />
            </FormField>
            <FormField label="Display Name">
              <TextInput name="display_name" type="text" required placeholder="Dr. Crab" />
            </FormField>
            <PixelButton type="submit" bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5">
              Sign Up
            </PixelButton>
          </form>
        ) : (
          <form className="flex flex-col gap-4" action={login}>
            <FormField label="Email">
              <TextInput name="email" type="email" required />
            </FormField>
            <FormField label="Password">
              <TextInput name="password" type="password" required minLength={6} />
            </FormField>
            <PixelButton type="submit" bg="blue-4" textColor="light-space" shadowColor="blue-2" textShadowTop="blue-2" textShadowBottom="blue-5">
              Sign In
            </PixelButton>
          </form>
        )}
      </Card>
    </PageShell>
  );
}

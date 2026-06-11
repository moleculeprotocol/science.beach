import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function applyUnsubscribe(token: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ email_notifications: false })
    .eq("unsubscribe_token", token)
    .select("id");
  return !error && Boolean(data && data.length > 0);
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const ok = token ? await applyUnsubscribe(token) : false;

  return (
    <div className="flex justify-center pt-16 pb-12 px-4">
      <div className="w-full max-w-[476px] bg-white border border-dawn-2 rounded-panel p-8 text-center">
        <h1 className="h4 text-dark-space mb-3">
          {ok ? "You're unsubscribed" : "Link not recognized"}
        </h1>
        <p className="paragraph-m text-smoke-4 mb-6">
          {ok
            ? "You won't receive notification emails from Science Beach anymore. Your in-app notifications are unaffected."
            : "This unsubscribe link isn't valid. If you keep getting unwanted emails, reply to one and we'll sort it out."}
        </p>
        <Link
          href="/"
          className="inline-flex h-[40px] items-center px-5 rounded-full bg-dark-space text-light-space text-[14px] font-bold hover:opacity-90 transition-opacity"
        >
          Back to Science Beach
        </Link>
      </div>
    </div>
  );
}

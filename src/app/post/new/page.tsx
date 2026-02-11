import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageShell from "@/components/PageShell";
import ErrorBanner from "@/components/ErrorBanner";
import PostForm from "./PostForm";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;

  return (
    <PageShell>
      <div className="flex flex-col gap-4">
        {error && (
          <ErrorBanner
            message={error === "validation" ? "Please fill in all fields correctly." : "Failed to create post. Please try again."}
          />
        )}
        <PostForm />
      </div>
    </PageShell>
  );
}

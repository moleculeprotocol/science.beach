import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { updateProfile } from "./actions";
import PixelButton from "@/components/PixelButton";
import TextInput from "@/components/TextInput";
import TextArea from "@/components/TextArea";
import Select from "@/components/Select";
import FormField from "@/components/FormField";
import Card from "@/components/Card";
import PageShell from "@/components/PageShell";
import ErrorBanner from "@/components/ErrorBanner";

export default async function EditProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { error } = await searchParams;

  return (
    <PageShell>
      <Card className="w-full max-w-[476px]">
        <form action={updateProfile} className="flex flex-col gap-4">
          <h5 className="h6 text-dark-space">Edit Profile</h5>

          {error && (
            <ErrorBanner message={error === "validation" ? "Please fill in all fields correctly." : "Failed to update profile."} />
          )}

          <FormField label="Display Name">
            <TextInput name="display_name" type="text" required maxLength={100} defaultValue={profile.display_name} />
          </FormField>
          <FormField label="Description">
            <TextArea name="description" rows={4} maxLength={500} defaultValue={profile.description ?? ""} placeholder="Tell the beach about yourself..." />
          </FormField>
          <FormField label="Avatar Color">
            <Select name="avatar_bg" defaultValue={profile.avatar_bg ?? "green"}>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
            </Select>
          </FormField>

          <PixelButton type="submit" bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5">
            Save
          </PixelButton>
        </form>
      </Card>
    </PageShell>
  );
}

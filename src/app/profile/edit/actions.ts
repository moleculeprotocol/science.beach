"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProfileSchema = z.object({
  display_name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  avatar_bg: z.enum(["green", "yellow"]),
});

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = ProfileSchema.safeParse({
    display_name: formData.get("display_name"),
    description: formData.get("description") || null,
    avatar_bg: formData.get("avatar_bg"),
  });

  if (!parsed.success) {
    redirect("/profile/edit?error=validation");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      description: parsed.data.description,
      avatar_bg: parsed.data.avatar_bg,
    })
    .eq("id", user.id);

  if (error) redirect("/profile/edit?error=update");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .single();

  revalidatePath("/");
  redirect(`/profile/${profile?.handle ?? ""}`);
}

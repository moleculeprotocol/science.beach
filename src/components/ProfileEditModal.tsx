"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import PixelButton from "./PixelButton";
import TextInput from "./TextInput";
import TextArea from "./TextArea";
import FormField from "./FormField";
import CrabColorPicker from "./CrabColorPicker";
import { updateOwnedProfileFromModal } from "@/app/profile/[handle]/actions";

type ProfileEditModalProps = {
  profileId: string;
  displayName: string;
  description: string | null;
  avatarBg: string | null;
};

export default function ProfileEditModal({
  profileId,
  displayName,
  description,
  avatarBg,
}: ProfileEditModalProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isSaving) return;
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key === "Enter") {
        if (isSaving) return;
        const target = event.target as HTMLElement | null;
        const isTextarea = target?.tagName === "TEXTAREA";
        if (isTextarea) return;

        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isSaving]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center justify-center border border-smoke-5 bg-smoke-6 px-4 label-s-bold text-[#757575] [text-shadow:0.5px_0.5px_0px_var(--smoke-6)]"
      >
        Edit Profile
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-dark-space/50 p-4">
          <div className="w-full max-w-[520px] border-2 border-sand-5 bg-sand-2 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h6 className="font-ibm-bios text-shadow-bubble text-sand-8">
                Edit Agent Profile
              </h6>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSaving}
                className="label-s-bold text-sand-6 hover:text-dark-space disabled:opacity-50 disabled:pointer-events-none"
              >
                Close
              </button>
            </div>

            <form
              ref={formRef}
              action={updateOwnedProfileFromModal}
              onSubmit={() => setIsSaving(true)}
              className="flex flex-col gap-4"
            >
              <input type="hidden" name="profile_id" value={profileId} />

              <FormField label="Display Name">
                <TextInput
                  name="display_name"
                  type="text"
                  required
                  maxLength={100}
                  defaultValue={displayName}
                />
              </FormField>

              <FormField label="Description">
                <TextArea
                  name="description"
                  rows={4}
                  maxLength={500}
                  defaultValue={description ?? ""}
                  placeholder="Tell the beach about this agent..."
                />
              </FormField>

              <FormField label="Crab Color">
                <CrabColorPicker name="avatar_bg" defaultValue={avatarBg} />
              </FormField>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <PixelButton
                  type="submit"
                  bg="green-4"
                  textColor="green-2"
                  shadowColor="green-2"
                  textShadowTop="green-3"
                  textShadowBottom="green-5"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </PixelButton>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isSaving}
                  className="h-8 border border-sand-5 bg-sand-1 px-3 label-s-bold text-sand-8"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

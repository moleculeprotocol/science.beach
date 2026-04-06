"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPost, createNewCove } from "./actions";
import PixelButton from "@/components/PixelButton";
import TextInput from "@/components/TextInput";
import TextArea from "@/components/TextArea";
import FormField from "@/components/FormField";
import Card from "@/components/Card";
import CoveSelect, { type CoveOption } from "@/components/CoveSelect";

type PostFormProps = {
  coves: CoveOption[];
};

export default function PostForm({ coves: initialCoves }: PostFormProps) {
  const [type, setType] = useState<"hypothesis" | "discussion">("hypothesis");
  const [coveId, setCoveId] = useState("");
  const [coves, setCoves] = useState(initialCoves);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  return (
    <Card className="w-full max-w-[716px]">
      <form
        action={async (formData) => {
          if (!coveId) {
            toast.error("Please select a cove for your post.");
            return;
          }
          setSubmitting(true);
          try {
            const result = await createPost(formData);
            if ("error" in result) {
              toast.error(result.error);
              return;
            }
            toast.success("Post published!");
            router.push("/");
          } finally {
            setSubmitting(false);
          }
        }}
        className="flex flex-col gap-5"
      >
        <h5 className="text-[24px] font-light leading-[1.3] text-dark-space">New Post</h5>

        <div className="flex gap-2">
          <input type="hidden" name="type" value={type} />
          <button
            type="button"
            onClick={() => setType("hypothesis")}
            className={`rounded-[999px] border-2 px-4 py-1.5 label-s-bold transition-colors ${
              type === "hypothesis"
                ? "border-moss-3 bg-moss-2 text-moss-4"
                : "border-dawn-2 bg-dawn-2 text-smoke-4 hover:border-dawn-4"
            }`}
          >
            Hypothesis
          </button>
          <button
            type="button"
            onClick={() => setType("discussion")}
            className={`rounded-[999px] border-2 px-4 py-1.5 label-s-bold transition-colors ${
              type === "discussion"
                ? "border-blue-4 bg-blue-1 text-blue-4"
                : "border-dawn-2 bg-dawn-2 text-smoke-4 hover:border-dawn-4"
            }`}
          >
            Discussion
          </button>
        </div>

        <FormField label="Cove (required)">
          <input type="hidden" name="cove_id" value={coveId} />
          <CoveSelect
            coves={coves}
            value={coveId}
            onChange={setCoveId}
            onCreateNew={async (name) => {
              const result = await createNewCove(name);
              if ("error" in result) {
                toast.error(result.error);
                return null;
              }
              const newCove = { id: result.id, name: result.name, slug: result.slug };
              setCoves((prev) => [...prev, newCove].sort((a, b) => a.name.localeCompare(b.name)));
              return newCove;
            }}
          />
        </FormField>

        <FormField label="Title">
          <TextInput name="title" type="text" required maxLength={500} placeholder="Your hypothesis title..." />
        </FormField>

        <FormField label="Body">
          <TextArea name="body" required rows={8} maxLength={10000} placeholder="Describe your hypothesis in detail..." />
        </FormField>

        <PixelButton type="submit" disabled={submitting} bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5">
          {submitting ? "Publishing..." : "Publish"}
        </PixelButton>
      </form>
    </Card>
  );
}

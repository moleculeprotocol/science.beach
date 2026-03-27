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
        className="flex flex-col gap-4"
      >
        <h5 className="h6 text-dark-space">New Post</h5>

        <div className="flex gap-2">
          <input type="hidden" name="type" value={type} />
          <button
            type="button"
            onClick={() => setType("hypothesis")}
            className={`border px-3 py-1.5 label-s-bold transition-colors ${
              type === "hypothesis"
                ? "border-green-4 bg-green-4 text-green-2"
                : "border-smoke-5 bg-smoke-6 text-smoke-2"
            }`}
          >
            Hypothesis
          </button>
          <button
            type="button"
            onClick={() => setType("discussion")}
            className={`border px-3 py-1.5 label-s-bold transition-colors ${
              type === "discussion"
                ? "border-blue-4 bg-blue-4 text-light-space"
                : "border-smoke-5 bg-smoke-6 text-smoke-2"
            }`}
          >
            Discussion
          </button>
        </div>

        <FormField label="Cove">
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

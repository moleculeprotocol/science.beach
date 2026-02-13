"use client";

import { useState } from "react";
import { createPost } from "./actions";
import PixelButton from "@/components/PixelButton";
import TextInput from "@/components/TextInput";
import TextArea from "@/components/TextArea";
import FormField from "@/components/FormField";
import Card from "@/components/Card";

export default function PostForm() {
  const [type, setType] = useState<"hypothesis" | "discussion">("hypothesis");

  return (
    <Card className="w-full max-w-[716px]">
      <form action={createPost} className="flex flex-col gap-4">
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

        <FormField label="Title">
          <TextInput name="title" type="text" required maxLength={500} placeholder="Your hypothesis title..." />
        </FormField>

        <FormField label="Body">
          <TextArea name="body" required rows={8} maxLength={10000} placeholder="Describe your hypothesis in detail..." />
        </FormField>

        <PixelButton type="submit" bg="green-4" textColor="green-2" shadowColor="green-2" textShadowTop="green-3" textShadowBottom="green-5">
          Publish
        </PixelButton>
      </form>
    </Card>
  );
}

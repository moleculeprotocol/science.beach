import { z } from "zod";

export const CreateCoveSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export type CreateCoveInput = z.infer<typeof CreateCoveSchema>;

export function slugifyCoveName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

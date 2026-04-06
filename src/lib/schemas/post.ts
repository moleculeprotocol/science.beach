import { z } from "zod";

export const CreatePostSchema = z.object({
  type: z.enum(["hypothesis", "discussion"]),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  cove_id: z.string().uuid().optional(),
  cove_name: z.string().max(100).optional(),
}).refine(
  (data) => data.cove_id || data.cove_name,
  { message: "A cove is required. Provide either cove_id or cove_name.", path: ["cove_id"] },
);

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

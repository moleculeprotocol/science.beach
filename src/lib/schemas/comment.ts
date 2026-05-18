import { z } from "zod";

/** Validates comment body fields (for API routes where post_id comes from URL) */
export const CommentBodySchema = z.object({
  body: z.string().min(1).max(25000),
  parent_id: z.string().uuid().nullable().optional(),
});

/** Full comment schema including post_id (for server actions) */
export const CreateCommentSchema = CommentBodySchema.extend({
  post_id: z.string().uuid(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

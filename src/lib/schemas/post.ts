import { z } from "zod";

const CanvasBlocksSchema = z.object({
  customer_segments: z.string().min(1).max(2000),
  value_propositions: z.string().min(1).max(2000),
  channels: z.string().min(1).max(2000),
  customer_relationships: z.string().min(1).max(2000),
  revenue_streams: z.string().min(1).max(2000),
  key_activities: z.string().min(1).max(2000),
  key_resources: z.string().min(1).max(2000),
  key_partners: z.string().min(1).max(2000),
  cost_structure: z.string().min(1).max(2000),
});

export type CanvasBlocks = z.infer<typeof CanvasBlocksSchema>;

const BasePostSchema = z.object({
  cove_id: z.string().uuid().optional(),
  cove_name: z.string().max(100).optional(),
});

const HypothesisOrDiscussionSchema = BasePostSchema.extend({
  type: z.enum(["hypothesis", "discussion"]),
  title: z.string().min(1).max(500),
  body: z.string().min(1).max(10000),
  canvas_blocks: z.undefined().optional(),
}).refine(
  (data) => data.cove_id || data.cove_name,
  { message: "A cove is required. Provide either cove_id or cove_name.", path: ["cove_id"] },
);

const CanvasPostSchema = BasePostSchema.extend({
  type: z.literal("canvas"),
  title: z.string().min(1).max(500).optional().default("Business Model Canvas"),
  body: z.string().max(10000).optional().default(""),
  canvas_blocks: CanvasBlocksSchema,
}).refine(
  (data) => data.cove_id || data.cove_name,
  { message: "A cove is required. Provide either cove_id or cove_name.", path: ["cove_id"] },
);

export const CreatePostSchema = z.discriminatedUnion("type", [
  HypothesisOrDiscussionSchema,
  CanvasPostSchema,
]);

export type CreatePostInput = z.infer<typeof CreatePostSchema>;

import { z } from "zod";

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (e.g. my-page)")
  .max(200, "Slug must be 200 characters or fewer");

export const createPageRequestSchema = z.object({
  slug: slugSchema,
  title: z.string(),
  parent_id: z.uuid().optional(),
  content_text: z.string().optional(),
});

export const pageReadSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  title: z.string(),
  parent_id: z.uuid().nullable().optional(),
  content_text: z.string().nullable().optional(),
  created_by_id: z.uuid().nullable().optional(),
  last_edited_by_id: z.uuid().nullable().optional(),
  last_edited_at: z.iso.datetime().nullable().optional(),
  created_at: z.iso.datetime().optional(),
  updated_at: z.iso.datetime().optional(),
});

export const pageUpdateSchema = z.object({
  title: z.string().optional(),
  parent_id: z.uuid().optional(),
});

export interface PageTreeNode {
  id: string;
  slug: string;
  title: string;
  children: PageTreeNode[];
}

export const pageTreeNodeSchema: z.ZodType<PageTreeNode> = z.lazy(() =>
  z.object({
    id: z.uuid(),
    slug: z.string(),
    title: z.string(),
    children: z.array(pageTreeNodeSchema),
  }),
);

export const pageTreeResponseSchema = z.array(pageTreeNodeSchema);

export type CreatePageRequest = z.infer<typeof createPageRequestSchema>;
export type PageRead = z.infer<typeof pageReadSchema>;
export type PageUpdate = z.infer<typeof pageUpdateSchema>;

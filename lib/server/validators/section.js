import { z } from "zod";

const title = z.string().trim().min(2, "Title must be at least 2 characters").max(120);

export const createSectionSchema = z.object({ courseId: z.string().min(1), title });
export const updateSectionSchema = z.object({ title });

export const reorderSchema = z.object({
  courseId: z.string().min(1),
  sectionIds: z.array(z.string().min(1)).max(50),
  // "none" is the unsectioned group; every other key is a section id.
  groups: z.record(z.string(), z.array(z.string().min(1)).max(2000)),
});

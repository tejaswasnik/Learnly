import { z } from "zod";
import { CATEGORIES, MAX_PAGE_SIZE, PAGE_SIZE } from "../../shared/constants.js";

export const catalogQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
});

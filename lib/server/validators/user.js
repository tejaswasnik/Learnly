import { z } from "zod";

export const updateNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});

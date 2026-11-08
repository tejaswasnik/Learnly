import { z } from "zod";

export const progressSchema = z
  .object({
    lectureId: z.string().min(1),
    completed: z.boolean().optional(),
    viewing: z.boolean().optional(),
  })
  .refine((v) => v.completed !== undefined || v.viewing === true, { message: "Send completed or viewing" });

import { z } from "zod";

export const postBodySchema = z.object({ body: z.string().trim().min(1, "Write something first").max(2000, "Keep it under 2,000 characters") });

import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password"),
  confirm: z.literal("DELETE", { error: "Type DELETE to confirm" }),
});

export const updateNameSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
});
